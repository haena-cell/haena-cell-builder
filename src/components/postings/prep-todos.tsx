"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/posting-actions";
import { usePostingActions } from "@/components/postings/demo-context";
import { daysToDate, formatDueDate, type PrepItem, type Subtask } from "@/lib/postings";
import { cn } from "@/lib/utils";

// 공고 상세의 준비 항목 할 일 (D-20): 항목 체크·마감 날짜·이름 바꾸기·삭제, 항목 안의 하위 할 일

type Items = PrepItem[];

// 마감 날짜: 있으면 "11월 5일 (목) · D-3" 칩, 없으면 [마감일] 버튼. 누르면 날짜 고르기.
function DueDate({
  value,
  done,
  today,
  onChange,
}: {
  value: string | null;
  done: boolean;
  today: string;
  onChange: (value: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <span className="flex items-center gap-1">
        <Input
          type="date"
          aria-label="마감 날짜"
          className="h-8 w-36 text-xs"
          defaultValue={value ?? ""}
          autoFocus
          onChange={(e) => {
            if (!e.target.value) return;
            onChange(e.target.value);
            setEditing(false);
          }}
        />
        {value && (
          <Button variant="ghost" size="icon-sm" aria-label="마감 날짜 지우기" onClick={() => { onChange(null); setEditing(false); }}>
            <X />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
          닫기
        </Button>
      </span>
    );
  }

  if (!value) {
    return (
      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => setEditing(true)}>
        <CalendarDays data-icon="inline-start" />
        마감일
      </Button>
    );
  }

  return <DueChip value={value} done={done} today={today} onClick={() => setEditing(true)} />;
}

// 마감 날짜 칩. 안 끝낸 일이 하루 안으로 남았거나 지났으면 빨갛게.
export function DueChip({ value, done, today, onClick }: { value: string; done: boolean; today: string; onClick?: () => void }) {
  const days = daysToDate(value, today);
  const className = cn(
    "shrink-0 rounded-full bg-due px-2.5 py-0.5 text-xs font-medium text-due-foreground tabular-nums",
    onClick && "hover:opacity-80",
    !done && days <= 1 && "bg-destructive-soft text-destructive",
    done && "bg-secondary text-muted-foreground",
  );
  if (!onClick) return <span className={className}>{formatDueDate(value, today)}</span>;
  return (
    <button type="button" onClick={onClick} aria-label={`마감 날짜 ${formatDueDate(value, today)}, 바꾸기`} className={className}>
      {formatDueDate(value, today)}
    </button>
  );
}

// 한 줄 입력 + [추가]
function AddRow({ placeholder, maxLength, onAdd }: { placeholder: string; maxLength: number; onAdd: (label: string) => Promise<boolean> }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!value.trim() || busy) return;
    setBusy(true);
    if (await onAdd(value)) setValue("");
    setBusy(false);
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9"
        value={value}
        maxLength={maxLength}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <Button type="button" variant="outline" size="lg" onClick={submit} disabled={busy || !value.trim()} aria-label={placeholder}>
        <Plus />
      </Button>
    </div>
  );
}

export function PrepTodos({
  postingId,
  items,
  today,
  onItemsChange,
}: {
  postingId: string;
  items: Items;
  today: string;
  onItemsChange: (update: (items: Items) => Items) => void;
}) {
  const { addPrepItem, addSubtask, deletePrepItem, deleteSubtask, setPrepDone, updatePrepItem, updateSubtask } = usePostingActions();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [renaming, setRenaming] = useState<string | null>(null);

  const toggleOpen = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // 화면을 먼저 바꾸고 저장. 실패하면 되돌리고 알린다.
  async function run(change: (items: Items) => Items, save: () => Promise<ActionResult>) {
    const before = items;
    onItemsChange(change);
    const result = await save();
    if (!result.ok) {
      onItemsChange(() => before);
      toast.error(result.message);
    }
    return result.ok;
  }

  const patchItem = (id: string, patch: Partial<PrepItem>) => (list: Items) =>
    list.map((it) => (it.id === id ? { ...it, ...patch } : it));
  const patchSub = (itemId: string, subId: string, patch: Partial<Subtask> | null) => (list: Items) =>
    list.map((it) =>
      it.id !== itemId
        ? it
        : {
            ...it,
            subtasks: patch === null
              ? it.subtasks.filter((t) => t.id !== subId)
              : it.subtasks.map((t) => (t.id === subId ? { ...t, ...patch } : t)),
          },
    );

  async function addItem(label: string) {
    const result = await addPrepItem(postingId, label);
    if (!result.ok) {
      toast.error(result.message);
      return false;
    }
    onItemsChange((list) => [...list, { id: result.id, label: label.trim(), done: false, dueDate: null, subtasks: [] }]);
    return true;
  }

  async function addSub(itemId: string, label: string) {
    const result = await addSubtask(itemId, label);
    if (!result.ok) {
      toast.error(result.message);
      return false;
    }
    onItemsChange((list) =>
      list.map((it) =>
        it.id === itemId
          ? { ...it, subtasks: [...it.subtasks, { id: result.id, label: label.trim(), done: false, dueDate: null }] }
          : it,
      ),
    );
    return true;
  }

  async function removeItem(item: PrepItem) {
    const ok = await run((list) => list.filter((it) => it.id !== item.id), () => deletePrepItem(item.id));
    if (ok) toast(`'${item.label}' 항목을 지웠어요`);
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const isOpen = open.has(item.id);
          const subDone = item.subtasks.filter((t) => t.done).length;
          return (
            <li key={item.id} className="flex flex-col gap-2 rounded-2xl bg-muted px-2 py-2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-1.5 py-1 hover:bg-accent">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => run(patchItem(item.id, { done: !item.done }), () => setPrepDone(item.id, !item.done))}
                    className="size-4 shrink-0 accent-primary"
                  />
                  <span className={cn("truncate text-sm", item.done && "text-muted-foreground line-through")}>{item.label}</span>
                </label>
                <DueDate
                  value={item.dueDate}
                  done={item.done}
                  today={today}
                  onChange={(dueDate) => run(patchItem(item.id, { dueDate }), () => updatePrepItem(item.id, { dueDate }))}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  aria-expanded={isOpen}
                  onClick={() => toggleOpen(item.id)}
                >
                  {item.subtasks.length > 0 ? (
                    <span className="tabular-nums">할 일 {subDone}/{item.subtasks.length}</span>
                  ) : (
                    "할 일"
                  )}
                  <ChevronDown data-icon="inline-end" className={cn("transition-transform", isOpen && "rotate-180")} />
                </Button>
              </div>

              {isOpen && (
                <div className="ml-7 flex flex-col gap-2 border-l border-input pl-3">
                  {item.subtasks.length > 0 && (
                    <ul className="flex flex-col gap-1">
                      {item.subtasks.map((sub) => (
                        <li key={sub.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-xl px-1.5 py-1 hover:bg-accent">
                            <input
                              type="checkbox"
                              checked={sub.done}
                              onChange={() =>
                                run(patchSub(item.id, sub.id, { done: !sub.done }), () => updateSubtask(sub.id, { done: !sub.done }))
                              }
                              className="size-4 shrink-0 accent-primary"
                            />
                            <span className={cn("text-sm", sub.done && "text-muted-foreground line-through")}>{sub.label}</span>
                          </label>
                          <DueDate
                            value={sub.dueDate}
                            done={sub.done}
                            today={today}
                            onChange={(dueDate) =>
                              run(patchSub(item.id, sub.id, { dueDate }), () => updateSubtask(sub.id, { dueDate }))
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`${sub.label} 지우기`}
                            onClick={() => run(patchSub(item.id, sub.id, null), () => deleteSubtask(sub.id))}
                          >
                            <X />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <AddRow placeholder="하위 할 일 추가" maxLength={100} onAdd={(label) => addSub(item.id, label)} />

                  {renaming === item.id ? (
                    <form
                      className="flex gap-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const label = String(new FormData(e.currentTarget).get("label") ?? "");
                        if (await run(patchItem(item.id, { label: label.trim() }), () => updatePrepItem(item.id, { label })))
                          setRenaming(null);
                      }}
                    >
                      <Input name="label" aria-label="항목 이름" className="h-9" defaultValue={item.label} maxLength={50} autoFocus />
                      <Button type="submit" size="lg" className="px-3">저장</Button>
                      <Button type="button" variant="ghost" size="lg" className="px-3" onClick={() => setRenaming(null)}>취소</Button>
                    </form>
                  ) : (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setRenaming(item.id)}>
                        <Pencil data-icon="inline-start" />
                        이름 바꾸기
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => removeItem(item)}>
                        <Trash2 data-icon="inline-start" />
                        항목 지우기
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {items.length === 0 && <p className="text-sm text-muted-foreground">준비 항목이 없어요. 아래에서 추가해 보세요.</p>}
      <AddRow placeholder="준비 항목 추가 (예: 자기소개서)" maxLength={50} onAdd={addItem} />
    </div>
  );
}
