"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePanel } from "@/components/date-time-picker";
import type { ActionResult } from "@/lib/posting-actions";
import { pushUndo } from "@/lib/undo";
import { usePostingActions } from "@/components/postings/demo-context";
import { daysToDate, formatDueDate, type PrepItem, type Subtask } from "@/lib/postings";
import { cn } from "@/lib/utils";

// 공고 상세의 준비 항목 할 일 (D-20): 항목 체크·마감 날짜·이름 바꾸기·삭제, 항목 안의 하위 할 일
// 2026-11-12 사용자 요청: 항목 체크 → 하위 할 일도 모두 체크, 글자를 누르면 바로 고치기, 날짜는 누르면 바로 달력, 날짜는 오른쪽

type Items = PrepItem[];

// 마감 날짜: 누르면 바로 달력이 뜬다(D-69, 브라우저 기본 창 대신). 없으면 [마감일], 있으면 "D-3 | 11/5 (목)" 칩
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
  const [open, setOpen] = useState(false);
  return (
    <span className="relative ml-auto flex shrink-0 items-center gap-0.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {value ? (
            <span>
              {/* 눌림은 바깥 Popover 가 받는다 (버튼 모양·키보드 초점용으로 빈 onClick) */}
              <DueChip value={value} done={done} today={today} onClick={() => {}} />
            </span>
          ) : (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
              <CalendarDays data-icon="inline-start" />
              마감일
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-2">
          <DatePanel
            value={value ?? ""}
            onPick={(key) => {
              onChange(key);
              setOpen(false);
            }}
            onClear={() => {
              onChange(null);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {value && (
        <Button variant="ghost" size="icon-xs" className="text-muted-foreground" aria-label="마감 날짜 지우기" onClick={() => onChange(null)}>
          <X />
        </Button>
      )}
    </span>
  );
}

export function DueChip({ value, done, today, onClick }: { value: string; done: boolean; today: string; onClick?: () => void }) {
  const days = daysToDate(value, today);
  const className = cn(
    "ml-auto shrink-0 rounded-xs bg-due px-2 py-0.5 text-right text-xs font-medium text-due-foreground tabular-nums",
    onClick && "hover:opacity-80",
    // 색 기준 (2026-11-12, 공고 마감과 같게): D-3 ~ D-day 빨강, 지난 날짜·끝낸 일은 회색, 그 밖은 노랑
    !done && days >= 0 && days <= 3 && "bg-destructive-soft text-destructive",
    (done || days < 0) && "bg-secondary text-muted-foreground",
  );
  // "D-5 | 11/26 (화)" 의 가운데 막대는 글자색 25% · 2px, 양옆 8px 띄움 해서 날짜 정보와 구분한다 (2026-11-12 사용자 요청)
  const [left, date] = formatDueDate(value, today).split(" | ");
  const text = (
    <span className="inline-flex items-center gap-2">
      {left}
      <span aria-hidden className="inline-block h-[0.85em] w-0.5 rounded-full bg-current opacity-25" />
      <span className="sr-only">, </span>
      {date}
    </span>
  );
  if (!onClick) return <span className={className}>{text}</span>;
  return (
    <button type="button" onClick={onClick} aria-label={`마감 날짜 ${left} ${date}, 바꾸기`} className={className}>
      {text}
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

  // 바꾼 뒤 Ctrl+Z 로 되돌릴 수 있게 반대 동작을 쌓는다 (D-62)
  async function undoable(
    label: string,
    change: (items: Items) => Items,
    save: () => Promise<ActionResult>,
    revert: (items: Items) => Items,
    revertSave: () => Promise<ActionResult>,
  ) {
    const ok = await run(change, save);
    if (ok) pushUndo(label, () => run(revert, revertSave));
    return ok;
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
    const subIds = new Set(subs.map((t) => t.id));
    const saveAll = (d: boolean) => async () => {
      const results = await Promise.all([setPrepDone(item.id, d), ...subs.map((t) => updateSubtask(t.id, { done: d }))]);
      return results.find((r) => !r.ok) ?? results[0];
    };
    return undoable(
      `'${item.label}' ${done ? "체크" : "체크 풀기"}`,
      (list) =>
        list.map((it) =>
          it.id !== item.id ? it : { ...it, done, subtasks: done ? it.subtasks.map((t) => ({ ...t, done: true })) : it.subtasks },
        ),
      saveAll(done),
      // 되돌릴 때는 이번에 함께 끝낸 하위 할 일만 다시 안 끝낸 것으로
      (list) =>
        list.map((it) =>
          it.id !== item.id ? it : { ...it, done: item.done, subtasks: it.subtasks.map((t) => (subIds.has(t.id) ? { ...t, done: false } : t)) },
        ),
      saveAll(!done),
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
                  onSave={(label) =>
                    undoable(
                      `'${item.label}' 이름 바꾸기`,
                      patchItem(item.id, { label }),
                      () => updatePrepItem(item.id, { label }),
                      patchItem(item.id, { label: item.label }),
                      () => updatePrepItem(item.id, { label: item.label }),
                    )
                  }
                />
                {editing !== item.id && (
                  <>
                    <DueDate
                      value={item.dueDate}
                      done={item.done}
                      today={today}
                      onChange={(dueDate) =>
                        undoable(
                          `'${item.label}' 마감일`,
                          patchItem(item.id, { dueDate }),
                          () => updatePrepItem(item.id, { dueDate }),
                          patchItem(item.id, { dueDate: item.dueDate }),
                          () => updatePrepItem(item.id, { dueDate: item.dueDate }),
                        )
                      }
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
                            onChange={() =>
                              undoable(
                                `'${sub.label}' ${sub.done ? "체크 풀기" : "체크"}`,
                                patchSub(item.id, sub.id, { done: !sub.done }),
                                () => updateSubtask(sub.id, { done: !sub.done }),
                                patchSub(item.id, sub.id, { done: sub.done }),
                                () => updateSubtask(sub.id, { done: sub.done }),
                              )
                            }
                          />
                          <EditableText
                            value={sub.label}
                            done={sub.done}
                            maxLength={100}
                            editing={editing === sub.id}
                            setEditing={(on) => setEditing(on ? sub.id : null)}
                            onSave={(label) =>
                              undoable(
                                `'${sub.label}' 이름 바꾸기`,
                                patchSub(item.id, sub.id, { label }),
                                () => updateSubtask(sub.id, { label }),
                                patchSub(item.id, sub.id, { label: sub.label }),
                                () => updateSubtask(sub.id, { label: sub.label }),
                              )
                            }
                          />
                          {editing !== sub.id && (
                            <>
                              <DueDate
                                value={sub.dueDate}
                                done={sub.done}
                                today={today}
                                onChange={(dueDate) =>
                                  undoable(
                                    `'${sub.label}' 마감일`,
                                    patchSub(item.id, sub.id, { dueDate }),
                                    () => updateSubtask(sub.id, { dueDate }),
                                    patchSub(item.id, sub.id, { dueDate: sub.dueDate }),
                                    () => updateSubtask(sub.id, { dueDate: sub.dueDate }),
                                  )
                                }
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
