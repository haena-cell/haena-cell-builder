"use client";

import { useRef, useState } from "react";
import { CalendarDays, ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/posting-actions";
import { usePostingActions } from "@/components/postings/demo-context";
import { daysToDate, formatDueDate, type PrepItem, type Subtask } from "@/lib/postings";
import { cn } from "@/lib/utils";

// 공고 상세의 준비 항목 할 일 (D-20): 항목 체크·마감 날짜·이름 바꾸기·삭제, 항목 안의 하위 할 일
// 2026-11-12 사용자 요청: 항목 체크 → 하위 할 일도 모두 체크, 글자를 누르면 바로 고치기, 날짜는 누르면 바로 달력, 날짜는 오른쪽

type Items = PrepItem[];

// 마감 날짜: 누르면 바로 달력(브라우저 날짜 고르기)이 뜬다. 없으면 [마감일], 있으면 "D-3 | 11/5 (목)" 칩
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
  const picker = useRef<HTMLInputElement>(null);
  const open = () => {
    const el = picker.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  };

  return (
    <span className="relative ml-auto flex shrink-0 items-center gap-0.5">
      {/* 화면에 보이지 않는 날짜 칸: 달력만 띄우는 데 쓴다 */}
      <input
        ref={picker}
        type="date"
        aria-label="마감 날짜 고르기"
        tabIndex={-1}
        className="pointer-events-none absolute right-0 bottom-0 h-0 w-0 opacity-0"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      />
      {value ? (
        <>
          <DueChip value={value} done={done} today={today} onClick={open} />
          <Button variant="ghost" size="icon-xs" className="text-muted-foreground" aria-label="마감 날짜 지우기" onClick={() => onChange(null)}>
            <X />
          </Button>
        </>
      ) : (
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={open}>
          <CalendarDays data-icon="inline-start" />
          마감일
        </Button>
      )}
    </span>
  );
}

// 마감 날짜 칩. 안 끝낸 일이 하루 안으로 남았거나 지났으면 빨갛게.
export function DueChip({ value, done, today, onClick }: { value: string; done: boolean; today: string; onClick?: () => void }) {
  const days = daysToDate(value, today);
  const className = cn(
    "ml-auto shrink-0 rounded-xs bg-due px-2 py-0.5 text-right text-xs font-medium text-due-foreground tabular-nums",
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

// 글자를 누르면 그 자리에서 고친다. Enter 저장, Esc 취소, 밖을 누르면 저장
function EditableText({
  value,
  done,
  maxLength,
  editing,
  setEditing,
  onSave,
  className,
}: {
  value: string;
  done: boolean;
  maxLength: number;
  editing: boolean;
  setEditing: (on: boolean) => void;
  onSave: (label: string) => Promise<boolean>;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  async function save() {
    const label = draft.trim();
    if (!label || label === value) {
      setDraft(value);
      setEditing(false);
      return;
    }
    if (await onSave(label)) setEditing(false);
  }
  if (editing) {
    return (
      <Input
        aria-label="이름 고치기"
        className="h-8 min-w-0 flex-1 text-sm"
        value={draft}
        maxLength={maxLength}
        autoFocus
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            save();
          }
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      title="눌러서 고치기"
      className={cn("min-w-0 flex-1 truncate rounded-md px-1 py-0.5 text-left text-sm hover:bg-accent", done && "text-muted-foreground line-through", className)}
    >
      {value}
    </button>
  );
}

// 한 줄 입력 + [+]. Enter 로 바로 추가
function AddRow({
  placeholder,
  maxLength,
  onAdd,
  autoFocus = false,
}: {
  placeholder: string;
  maxLength: number;
  onAdd: (label: string) => Promise<boolean>;
  autoFocus?: boolean;
}) {
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
        autoFocus={autoFocus}
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

const Check = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
  <input type="checkbox" checked={checked} onChange={onChange} aria-label={`${label} 끝냄`} className="size-4 shrink-0 accent-primary" />
);

export function PrepTodos({
  postingId,
  items,
  today,
  onItemsChange,
  editMode = false,
}: {
  postingId: string;
  items: Items;
  today: string;
  onItemsChange: (update: (items: Items) => Items) => void;
  editMode?: boolean; // 공고 수정 화면: 모든 항목을 펼쳐 이름 바꾸기·지우기를 바로 보여 준다 (D-48)
}) {
  const { addPrepItem, addSubtask, deletePrepItem, deleteSubtask, setPrepDone, updatePrepItem, updateSubtask } = usePostingActions();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null); // 고치는 중인 글자: 항목 id 또는 하위 할 일 id

  const setOpenFor = (id: string, on: boolean) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
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

  // 항목을 체크하면 아래 하위 할 일도 모두 끝낸 것으로 (2026-11-12 사용자 요청). 체크를 풀 때는 하위 할 일을 그대로 둔다
  function toggleItem(item: PrepItem) {
    const done = !item.done;
    const subs = done ? item.subtasks.filter((t) => !t.done) : [];
    return run(
      (list) =>
        list.map((it) =>
          it.id !== item.id ? it : { ...it, done, subtasks: done ? it.subtasks.map((t) => ({ ...t, done: true })) : it.subtasks },
        ),
      async () => {
        const results = await Promise.all([setPrepDone(item.id, done), ...subs.map((t) => updateSubtask(t.id, { done: true }))]);
        return results.find((r) => !r.ok) ?? results[0];
      },
    );
  }

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
          const isOpen = editMode || open.has(item.id);
          const subDone = item.subtasks.filter((t) => t.done).length;
          const hasSubs = item.subtasks.length > 0;
          return (
            <li key={item.id} className="flex flex-col gap-2 rounded-2xl bg-muted px-2 py-2">
              <div className="flex items-center gap-2 px-1">
                <Check checked={item.done} onChange={() => toggleItem(item)} label={item.label} />
                <EditableText
                  value={item.label}
                  done={item.done}
                  maxLength={50}
                  editing={editing === item.id}
                  setEditing={(on) => setEditing(on ? item.id : null)}
                  onSave={(label) => run(patchItem(item.id, { label }), () => updatePrepItem(item.id, { label }))}
                />
                {editing !== item.id && (
                  <>
                    <DueDate
                      value={item.dueDate}
                      done={item.done}
                      today={today}
                      onChange={(dueDate) => run(patchItem(item.id, { dueDate }), () => updatePrepItem(item.id, { dueDate }))}
                    />
                    {hasSubs || isOpen ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 shrink-0 px-2 text-xs text-muted-foreground"
                        aria-expanded={isOpen}
                        aria-label={`${item.label} 하위 할 일 ${isOpen ? "접기" : "펼치기"}`}
                        onClick={() => setOpenFor(item.id, !isOpen)}
                      >
                        {hasSubs && <span className="tabular-nums">{subDone}/{item.subtasks.length}</span>}
                        <ChevronDown data-icon="inline-end" className={cn("transition-transform", isOpen && "rotate-180")} />
                      </Button>
                    ) : (
                      // 하위 할 일이 없으면 [+] 로 바로 입력칸을 연다 (2026-11-12 사용자 요청)
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground"
                        aria-label={`${item.label}에 하위 할 일 추가`}
                        onClick={() => setOpenFor(item.id, true)}
                      >
                        <Plus />
                      </Button>
                    )}
                  </>
                )}
              </div>

              {isOpen && (
                <div className="ml-6 flex flex-col gap-2 border-l border-input pl-3">
                  {hasSubs && (
                    <ul className="flex flex-col gap-1">
                      {item.subtasks.map((sub) => (
                        <li key={sub.id} className="flex items-center gap-2">
                          <Check
                            checked={sub.done}
                            label={sub.label}
                            onChange={() => run(patchSub(item.id, sub.id, { done: !sub.done }), () => updateSubtask(sub.id, { done: !sub.done }))}
                          />
                          <EditableText
                            value={sub.label}
                            done={sub.done}
                            maxLength={100}
                            editing={editing === sub.id}
                            setEditing={(on) => setEditing(on ? sub.id : null)}
                            onSave={(label) => run(patchSub(item.id, sub.id, { label }), () => updateSubtask(sub.id, { label }))}
                          />
                          {editing !== sub.id && (
                            <>
                              <DueDate
                                value={sub.dueDate}
                                done={sub.done}
                                today={today}
                                onChange={(dueDate) => run(patchSub(item.id, sub.id, { dueDate }), () => updateSubtask(sub.id, { dueDate }))}
                              />
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="shrink-0 text-muted-foreground"
                                aria-label={`${sub.label} 지우기`}
                                onClick={() => run(patchSub(item.id, sub.id, null), () => deleteSubtask(sub.id))}
                              >
                                <X />
                              </Button>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <AddRow placeholder="하위 할 일 추가" maxLength={100} onAdd={(label) => addSub(item.id, label)} autoFocus={!hasSubs && !editMode} />
                  <div className="flex gap-1">
                    {/* 이름 바꾸기: 항목 맨 위 줄이 바로 입력칸으로 바뀐다 */}
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setEditing(item.id)}>
                      <Pencil data-icon="inline-start" />
                      이름 바꾸기
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => removeItem(item)}>
                      <Trash2 data-icon="inline-start" />
                      항목 지우기
                    </Button>
                  </div>
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
