"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, ChevronDown, Flag, ListFilter, MoreHorizontal, Pencil, Trash2, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { pushUndo } from "@/lib/undo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppHref, usePostingActions } from "@/components/postings/demo-context";
import { DeadlineBadge } from "@/components/postings/posting-card";
import { PostingEditForm } from "@/components/postings/posting-edit-form";
import { StepDoneButton, StepDots } from "@/components/postings/step-bar";
import {
  currentStepIndex,
  daysLeftFor,
  EMPLOYMENT_TYPES,
  kstDateKey,
  PRIORITIES,
  withCurrentStep,
  type Posting,
  type Priority,
} from "@/lib/postings";
import { cn } from "@/lib/utils";
import { stepDoneToast } from "@/components/postings/step-done-toast";
import { Mascot } from "@/components/mascot";

// 공고 목록 표 (D-26): 한 줄에 공고 하나. 상태 탭 + 우선순위·근로형태 걸러 보기, 줄에서 우선순위·근로형태 고르기

type Status = "urgent" | "upcoming" | "inProgress" | "past";
const TABS: { value: Status | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "urgent", label: "마감 임박" },
  { value: "upcoming", label: "마감 전" },
  { value: "inProgress", label: "진행 중" },
  { value: "past", label: "지난 공고" },
];
const NO_TYPE = "미정";
// 표 칸 너비 (D-44): 좁으면 기업·직무에 자리를 주고, 표가 넓을 때만 진행 단계 점을 보여 준다
const TABLE_COLUMNS =
  "lg:grid-cols-[minmax(0,1fr)_5.5rem_4.5rem_4.5rem_4.5rem_6rem_8.5rem] lg:@[60rem]:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_6.5rem_6rem_5.5rem_7rem_9.5rem]";

// 마감 임박(D-3 이내) · 마감 전 · 진행 중(지원함) · 지난 공고
function statusOf(posting: Posting, days: number | null): Status {
  const applied = posting.steps[0]?.completedAt !== null;
  const finished = currentStepIndex(posting.steps) === -1;
  if (finished || (!applied && days !== null && days < 0)) return "past";
  if (applied) return "inProgress";
  if (days !== null && days <= 3) return "urgent";
  return "upcoming";
}

const STATUS_ORDER: Status[] = ["urgent", "upcoming", "inProgress", "past"];

// 정렬 (D-65): 걸러 보기와 따로. 고른 정렬은 이 브라우저에 기억
type Sort = "status" | "newest" | "priority" | "deadlineSoon" | "deadlineLate";
const SORTS: { value: Sort; label: string }[] = [
  { value: "status", label: "상태순" },
  { value: "newest", label: "최신순" },
  { value: "priority", label: "우선순위순" },
  { value: "deadlineSoon", label: "마감 임박순" },
  { value: "deadlineLate", label: "마감 늦은순" },
];
const SORT_KEY = "hurdle.postings.sort";
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
// 마감 정렬에서 묶음 순서: 마감 전(남은 날 있음) → 상시·채용 시 마감 → 마감 지남
const deadlineGroup = (days: number | null) => (days === null ? 1 : days < 0 ? 2 : 0);
const PRIORITY_CHIP: Record<Priority, string> = {
  high: "bg-due text-due-foreground",
  medium: "bg-secondary text-foreground/70",
  low: "border border-border bg-card text-muted-foreground",
};

function formatShortDeadline(posting: Posting) {
  if (posting.deadlineKind === "rolling") return "상시";
  if (posting.deadlineKind === "until_filled") return "채용 시";
  if (!posting.deadlineAt) return "—";
  const key = kstDateKey(new Date(posting.deadlineAt));
  return `${Number(key.slice(5, 7))}월 ${Number(key.slice(8))}일`;
}

// 걸러 보기 드롭다운 (여러 개 고르기, 아무것도 안 고르면 전체)
function FilterMenu({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const active = selected.length > 0;
  // 고른 옵션 (보기 순서대로)
  const picked = options.filter((o) => selected.includes(o.value));
  return (
    <DropdownMenu>
      {/* 안 골랐을 때는 검정 글자, 고르면 대표 색 + 고른 옵션마다 [옵션 ×] 로 하나씩 지우기 (2026-11-12 사용자 요청) */}
      <div
        className={cn(
          "inline-flex min-h-8 flex-wrap items-center gap-1 rounded-sm border transition-colors",
          active ? "border-primary bg-primary-soft py-0.5 pr-1 text-primary-strong" : "border-input bg-card text-foreground",
        )}
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-sm px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              active ? "pr-1.5" : "hover:bg-muted",
            )}
          >
            {label}
            <ChevronDown className="size-3.5 shrink-0 opacity-70" />
          </button>
        </DropdownMenuTrigger>
        {picked.map((o) => (
          <span key={o.value} className="inline-flex h-6 items-center gap-0.5 rounded-xs bg-card pr-0.5 pl-2 text-xs font-semibold ring-1 ring-primary/30">
            {o.label}
            <button
              type="button"
              aria-label={`${label} ${o.label} 빼기`}
              title={`${o.label} 빼기`}
              onClick={() => onChange(selected.filter((v) => v !== o.value))}
              className="inline-flex size-5 items-center justify-center rounded-xs hover:bg-primary/15"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel>{label}로 걸러 보기</DropdownMenuLabel>
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.value}
            checked={selected.includes(o.value)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(checked) =>
              onChange(checked ? [...selected, o.value] : selected.filter((v) => v !== o.value))
            }
          >
            {o.label}
          </DropdownMenuCheckboxItem>
        ))}
        {active && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={false} onCheckedChange={() => onChange([])}>
              모두 보기
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 줄 안의 고르기 드롭다운 (우선순위·근로형태)
function PickMenu({
  label,
  value,
  display,
  chipClassName,
  options,
  onPick,
}: {
  label: string;
  value: string;
  display: string;
  chipClassName?: string;
  options: { value: string; label: string }[];
  onPick: (value: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${display}, 바꾸기`}
          className={cn(
            "relative z-10 inline-flex h-7 max-w-full items-center gap-1 rounded-sm px-2.5 text-xs font-medium transition-opacity hover:opacity-80",
            chipClassName ?? "bg-secondary text-foreground/70",
          )}
        >
          <span className="truncate">{display}</span>
          <ChevronDown className="size-3 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={onPick}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 상태 칸: 누르면 지금 단계를 드롭다운에서 고른다 (2026-11-12 사용자 요청). 앞 단계는 끝낸 것으로 표시된다
function StatusMenu({ posting, days, onPick }: { posting: Posting; days: number | null; onPick: (target: number) => void }) {
  const current = currentStepIndex(posting.steps);
  const value = String(current === -1 ? posting.steps.length : current);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={`${posting.company} 상태 바꾸기`} className="relative z-10 inline-flex items-center gap-0.5 rounded-xs transition-opacity hover:opacity-80">
          <DeadlineBadge posting={posting} daysLeft={days} />
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel>지금 단계</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onPick(Number(v))}>
          {[...posting.steps.map((s) => s.name), "전형 끝"].map((name, i) => (
            <DropdownMenuRadioItem key={`${name}-${i}`} value={String(i)}>
              {name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PostingList({
  initialPostings,
  daysLeft,
}: {
  initialPostings: Posting[];
  daysLeft: Record<string, number | null>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const href = useAppHref();
  const listHref = href("/app/postings");
  const { deletePosting, setCurrentStep, setStepCompleted: setStepCompletedAction, updatePostingFull, updatePostingMeta } = usePostingActions();
  const [postings, setPostings] = useState(initialPostings);
  // 처음 그릴 때는 서버가 센 D-day, 그 뒤에는 브라우저에서 센다
  const [now, setNow] = useState<Date | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [tab, setTab] = useState<Status | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  // 줄의 [⋯] 메뉴에서 연 편집 창·삭제 확인 창 (D-32)
  const [editing, setEditing] = useState<Posting | null>(null);
  const [deleting, setDeleting] = useState<Posting | null>(null);
  const [removing, setRemoving] = useState(false);
  const [sort, setSort] = useState<Sort>("status");
  // 여러 공고 고르기 (D-66): 드래그·체크로 고른 공고 id
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const drag = useRef<{ start: number; base: Set<string>; active: boolean } | null>(null);
  const suppressClick = useRef(false);

  // 고른 정렬은 이 브라우저에 기억 (D-65)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SORT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 저장소는 화면을 그린 뒤에만 읽을 수 있다
      if (SORTS.some((o) => o.value === saved)) setSort(saved as Sort);
    } catch {
      // 저장소를 못 쓰면 기본 정렬
    }
  }, []);

  function changeSort(next: Sort) {
    setSort(next);
    try {
      localStorage.setItem(SORT_KEY, next);
    } catch {
      // 무시
    }
  }

  // 드래그를 마치면 끝. 끌고 난 뒤 떨어진 자리의 줄이 눌린 것으로 처리되지 않게 잠깐 막는다
  useEffect(() => {
    function onUp() {
      if (drag.current?.active) {
        suppressClick.current = true;
        setTimeout(() => (suppressClick.current = false), 0);
      }
      drag.current = null;
      setDragging(false);
    }
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, []);

  // Esc 로 고른 것 해제
  const hasSelection = selected.size > 0;
  useEffect(() => {
    if (!hasSelection) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !document.querySelector("[role=dialog],[role=alertdialog],[role=menu]")) setSelected(new Set());
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasSelection]);

  const clearSelection = () => setSelected(new Set());
  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // 확인 화면에서 방금 저장한 공고(?saved=번호)를 알리고 잠깐 강조한다
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 지금 시각은 브라우저에서 화면을 그린 뒤에 센다
    setNow(new Date());
    const justSaved = searchParams.get("saved");
    if (!justSaved) return;
    setHighlightId(justSaved);
    toast("저장했어요", { id: `saved-${justSaved}` });
    router.replace(listHref, { scroll: false });
    const timer = setTimeout(() => setHighlightId(null), 3000);
    return () => clearTimeout(timer);
  }, [searchParams, router, listHref]);

  const replace = (id: string, change: (p: Posting) => Posting) =>
    setPostings((prev) => prev.map((p) => (p.id === id ? change(p) : p)));

  function setStepCompleted(postingId: string, stepIndex: number, completedAt: string | null) {
    replace(postingId, (p) => ({ ...p, steps: p.steps.map((s, i) => (i === stepIndex ? { ...s, completedAt } : s)) }));
  }

  // 화면을 먼저 바꾸고 DB 에 저장한다. 실패하면 되돌린다.
  async function saveStep(posting: Posting, stepIndex: number, completed: boolean) {
    const previous = posting.steps[stepIndex].completedAt;
    setStepCompleted(posting.id, stepIndex, completed ? new Date().toISOString() : null);
    const result = await setStepCompletedAction(posting.steps[stepIndex].id, completed);
    if (!result.ok) {
      setStepCompleted(posting.id, stepIndex, previous);
      toast.error(result.message);
    }
    return result.ok;
  }

  async function handleComplete(posting: Posting, stepIndex: number) {
    if (!(await saveStep(posting, stepIndex, true))) return;
    stepDoneToast({
      label: `${posting.company} · ${posting.steps[stepIndex].name}`,
      isLast: stepIndex === posting.steps.length - 1,
      undo: () => saveStep(posting, stepIndex, false),
    });
  }

  // 전형 끝 → 마지막 단계로 되돌리기
  const handleBack = (posting: Posting) => moveTo(posting, posting.steps.length - 1);

  // 지금 단계 바꾸기 (상태 드롭다운·되돌리기). target 이 단계 수면 전형 끝
  async function moveTo(posting: Posting, target: number, record = true) {
    const before = posting.steps;
    replace(posting.id, (p) => ({ ...p, steps: withCurrentStep(before, target) }));
    const result = await setCurrentStep(posting.id, target);
    if (!result.ok) {
      replace(posting.id, (p) => ({ ...p, steps: before }));
      return toast.error(result.message);
    }
    toast(`${posting.company} · 지금 단계: ${posting.steps[target]?.name ?? "전형 끝"}`);
    // Ctrl+Z: 바꾸기 전 단계로 (D-62)
    const from = currentStepIndex(before);
    if (record) pushUndo(`${posting.company} 단계 바꾸기`, () => moveTo(posting, from === -1 ? before.length : from, false));
  }

  async function saveMeta(posting: Posting, meta: { priority?: Priority; employmentType?: string | null }, record = true) {
    const before = posting;
    replace(posting.id, (p) => ({ ...p, ...meta }));
    const result = await updatePostingMeta(posting.id, meta);
    if (!result.ok) {
      replace(posting.id, () => before);
      return toast.error(result.message);
    }
    // Ctrl+Z: 바꾼 칸만 원래 값으로 (D-62)
    const back: { priority?: Priority; employmentType?: string | null } = {};
    if (meta.priority !== undefined) back.priority = before.priority;
    if (meta.employmentType !== undefined) back.employmentType = before.employmentType;
    if (record) pushUndo(`${posting.company} ${meta.priority !== undefined ? "우선순위" : "근로형태"}`, () => saveMeta({ ...before, ...meta }, back, false));
  }

  async function saveEdit(next: Posting) {
    const before = postings.find((p) => p.id === next.id);
    const result = await updatePostingFull(next.id, next, next.steps);
    if (!result.ok) return result.message;
    replace(next.id, () => ({ ...next, steps: result.steps }));
    setEditing(null);
    toast("고친 내용을 저장했어요");
    // Ctrl+Z: 고치기 전 내용으로 다시 저장 (D-62)
    if (before)
      pushUndo(`${before.company} 수정`, async () => {
        const back = await updatePostingFull(before.id, before, before.steps);
        if (!back.ok) return toast.error(back.message);
        replace(before.id, (p) => ({ ...before, prepItems: p.prepItems, steps: back.steps }));
      });
    return null;
  }

  async function confirmDelete() {
    if (!deleting) return;
    setRemoving(true);
    const result = await deletePosting(deleting.id);
    setRemoving(false);
    if (!result.ok) return toast.error(result.message);
    setPostings((prev) => prev.filter((p) => p.id !== deleting.id));
    toast(`${deleting.company} 공고를 지웠어요`);
    setDeleting(null);
  }

  const allDaysLeft = now ? Object.fromEntries(postings.map((p) => [p.id, daysLeftFor(p, now)])) : daysLeft;
  const statusById = Object.fromEntries(postings.map((p) => [p.id, statusOf(p, allDaysLeft[p.id] ?? null)]));
  const typeOf = (p: Posting) => p.employmentType?.trim() || NO_TYPE;
  const typeOptions = [...new Set([...EMPLOYMENT_TYPES, ...postings.map(typeOf)])].map((t) => ({ value: t, label: t }));

  const filtered = postings
    .filter((p) => priorityFilter.length === 0 || priorityFilter.includes(p.priority))
    .filter((p) => typeFilter.length === 0 || typeFilter.includes(typeOf(p)));
  const count = (s: Status | "all") => (s === "all" ? filtered.length : filtered.filter((p) => statusById[p.id] === s).length);
  const daysOf = (p: Posting) => allDaysLeft[p.id] ?? null;
  const soonFirst = (a: Posting, b: Posting) => (daysOf(a) ?? Infinity) - (daysOf(b) ?? Infinity);
  const addedOrder = new Map(postings.map((p, i) => [p.id, i])); // 넣은 순서 (DB 에서 넣은 시각 순으로 온다)
  const compare: Record<Sort, (a: Posting, b: Posting) => number> = {
    // 상태 순서(마감 임박 → … → 지난 공고) 안에서 마감이 빠른 순, 날짜 없는 공고는 뒤로
    status: (a, b) => STATUS_ORDER.indexOf(statusById[a.id]) - STATUS_ORDER.indexOf(statusById[b.id]) || soonFirst(a, b),
    newest: (a, b) => (addedOrder.get(b.id) ?? 0) - (addedOrder.get(a.id) ?? 0),
    priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || soonFirst(a, b),
    deadlineSoon: (a, b) => {
      const ga = deadlineGroup(daysOf(a));
      const gb = deadlineGroup(daysOf(b));
      if (ga !== gb) return ga - gb;
      return ga === 2 ? (daysOf(b) ?? 0) - (daysOf(a) ?? 0) : soonFirst(a, b); // 지난 공고는 최근에 지난 것부터
    },
    deadlineLate: (a, b) => {
      const ga = deadlineGroup(daysOf(a));
      const gb = deadlineGroup(daysOf(b));
      if (ga !== gb) return ga - gb;
      return (daysOf(b) ?? 0) - (daysOf(a) ?? 0);
    },
  };
  const rows = filtered.filter((p) => tab === "all" || statusById[p.id] === tab).sort(compare[sort]);
  const filtering = priorityFilter.length > 0 || typeFilter.length > 0;
  const selectedRows = rows.filter((p) => selected.has(p.id));
  const allSelected = rows.length > 0 && selectedRows.length === rows.length;

  // ── 드래그로 여러 줄 고르기 (D-66) ─────────────────────────
  function onRowPointerDown(e: React.PointerEvent, index: number) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return; // 컴퓨터 화면만
    if ((e.target as HTMLElement).closest("button, input, [role=menuitem]")) return;
    const keep = e.metaKey || e.ctrlKey || e.shiftKey;
    drag.current = { start: index, base: keep ? new Set(selected) : new Set(), active: false };
  }
  function onRowPointerEnter(index: number) {
    const d = drag.current;
    if (!d || (!d.active && index === d.start)) return;
    if (!d.active) {
      d.active = true;
      window.getSelection()?.removeAllRanges();
      setDragging(true);
    }
    const next = new Set(d.base);
    for (let i = Math.min(d.start, index); i <= Math.max(d.start, index); i++) next.add(rows[i].id);
    setSelected(next);
  }

  // ── 고른 공고 한꺼번에 바꾸기 (D-66) ───────────────────────
  async function bulkMeta(meta: { priority?: Priority; employmentType?: string | null }, label: string) {
    const targets = selectedRows;
    const field = meta.priority !== undefined ? "priority" : "employmentType";
    const backOf = (p: Posting) => (field === "priority" ? { priority: p.priority } : { employmentType: p.employmentType });
    const ids = new Set(targets.map((p) => p.id));
    setBulkBusy(true);
    setPostings((prev) => prev.map((p) => (ids.has(p.id) ? { ...p, ...meta } : p)));
    const results = await Promise.all(targets.map((p) => updatePostingMeta(p.id, meta)));
    setBulkBusy(false);
    const failed = targets.filter((_, i) => !results[i].ok);
    if (failed.length > 0) {
      const back = new Map(failed.map((p) => [p.id, p]));
      setPostings((prev) => prev.map((p) => (back.has(p.id) ? { ...p, ...backOf(back.get(p.id)!) } : p)));
      toast.error(`${failed.length}개 공고는 저장하지 못했어요. 다시 시도해 주세요.`);
    }
    const done = targets.filter((_, i) => results[i].ok);
    if (done.length === 0) return;
    toast(`${done.length}개 공고의 ${label}을 바꿨어요`);
    pushUndo(`${done.length}개 공고 ${label}`, async () => {
      const back = new Map(done.map((p) => [p.id, p]));
      setPostings((prev) => prev.map((p) => (back.has(p.id) ? { ...p, ...backOf(back.get(p.id)!) } : p)));
      await Promise.all(done.map((p) => updatePostingMeta(p.id, backOf(p))));
    });
  }

  async function bulkFinish() {
    const targets = selectedRows.filter((p) => currentStepIndex(p.steps) !== -1);
    if (targets.length === 0) return toast("고른 공고는 이미 전형이 끝났어요");
    const ids = new Set(targets.map((p) => p.id));
    setBulkBusy(true);
    setPostings((prev) => prev.map((p) => (ids.has(p.id) ? { ...p, steps: withCurrentStep(p.steps, p.steps.length) } : p)));
    const results = await Promise.all(targets.map((p) => setCurrentStep(p.id, p.steps.length)));
    setBulkBusy(false);
    const failed = targets.filter((_, i) => !results[i].ok);
    if (failed.length > 0) {
      const back = new Map(failed.map((p) => [p.id, p.steps]));
      setPostings((prev) => prev.map((p) => (back.has(p.id) ? { ...p, steps: back.get(p.id)! } : p)));
      toast.error(`${failed.length}개 공고는 저장하지 못했어요. 다시 시도해 주세요.`);
    }
    const done = targets.filter((_, i) => results[i].ok);
    if (done.length === 0) return;
    toast(`${done.length}개 공고를 전형 끝으로 옮겼어요`);
    pushUndo(`${done.length}개 공고 전형 끝`, async () => {
      const back = new Map(done.map((p) => [p.id, p.steps]));
      setPostings((prev) => prev.map((p) => (back.has(p.id) ? { ...p, steps: back.get(p.id)! } : p)));
      await Promise.all(done.map((p) => setCurrentStep(p.id, currentStepIndex(p.steps))));
    });
  }

  async function bulkDelete() {
    const targets = selectedRows;
    setRemoving(true);
    const results = await Promise.all(targets.map((p) => deletePosting(p.id)));
    setRemoving(false);
    const gone = new Set(targets.filter((_, i) => results[i].ok).map((p) => p.id));
    setPostings((prev) => prev.filter((p) => !gone.has(p.id)));
    setSelected((prev) => new Set([...prev].filter((id) => !gone.has(id))));
    setBulkDeleting(false);
    if (gone.size < targets.length) toast.error(`${targets.length - gone.size}개 공고는 지우지 못했어요. 다시 시도해 주세요.`);
    if (gone.size > 0) toast(`${gone.size}개 공고를 지웠어요`);
  }

  return (
    <Card className="@container gap-0 px-0 py-0 md:px-0 md:py-0">
      {/* 상태 탭 */}
      <div className="flex gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-border-subtle px-3 pt-3 md:px-6 md:pt-4" role="tablist" aria-label="상태">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => {
              setTab(t.value);
              clearSelection();
            }}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-2.5 pb-3 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground",
              tab === t.value && "border-foreground font-semibold text-foreground",
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-xs px-1.5 text-xs tabular-nums",
                t.value === "urgent" && count(t.value) > 0 ? "bg-destructive-soft text-destructive" : "bg-secondary",
              )}
            >
              {count(t.value)}
            </span>
          </button>
        ))}
      </div>

      {selectedRows.length > 0 ? (
        /* 고른 공고 편집 막대 (D-66) */
        <div className="flex flex-wrap items-center gap-2 px-3 py-3 md:px-6" role="toolbar" aria-label="고른 공고 한꺼번에 편집">
          <span className="mr-1 text-sm font-semibold text-primary-strong tabular-nums">{selectedRows.length}개 선택됨</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={bulkBusy}>
                우선순위
                <ChevronDown data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuLabel>우선순위 한꺼번에</DropdownMenuLabel>
              {PRIORITIES.map((o) => (
                <DropdownMenuItem key={o.value} onSelect={() => bulkMeta({ priority: o.value as Priority }, "우선순위")}>
                  {o.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={bulkBusy}>
                근로형태
                <ChevronDown data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuLabel>근로형태 한꺼번에</DropdownMenuLabel>
              {[...typeOptions.filter((o) => o.value !== NO_TYPE), { value: NO_TYPE, label: NO_TYPE }].map((o) => (
                <DropdownMenuItem key={o.value} onSelect={() => bulkMeta({ employmentType: o.value === NO_TYPE ? null : o.value }, "근로형태")}>
                  {o.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" disabled={bulkBusy} onClick={bulkFinish}>
            <Flag data-icon="inline-start" />
            전형 끝
          </Button>
          <Button variant="destructive" size="sm" disabled={bulkBusy} onClick={() => setBulkDeleting(true)}>
            <Trash2 data-icon="inline-start" />
            삭제
          </Button>
          <Button variant="ghost" size="icon-sm" className="ml-auto" aria-label="고르기 해제 (Esc)" title="고르기 해제 (Esc)" onClick={clearSelection}>
            <X />
          </Button>
        </div>
      ) : (
        /* 걸러 보기 + 정렬 */
        <div className="flex flex-wrap items-center gap-2 px-3 py-3 md:px-6">
          <ListFilter className="size-4 text-muted-foreground" aria-hidden />
          <FilterMenu
            label="우선순위"
            options={PRIORITIES}
            selected={priorityFilter}
            onChange={(next) => {
              setPriorityFilter(next);
              clearSelection();
            }}
          />
          <FilterMenu
            label="근로형태"
            options={typeOptions}
            selected={typeFilter}
            onChange={(next) => {
              setTypeFilter(next);
              clearSelection();
            }}
          />
          {filtering && (
            <Button variant="ghost" size="sm" onClick={() => { setPriorityFilter([]); setTypeFilter([]); }}>
              걸러 보기 지우기
            </Button>
          )}
          {/* 정렬 (D-65) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground">
                <ArrowUpDown data-icon="inline-start" />
                {SORTS.find((o) => o.value === sort)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>정렬</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sort} onValueChange={(v) => changeSort(v as Sort)}>
                {SORTS.map((o) => (
                  <DropdownMenuRadioItem key={o.value} value={o.value}>
                    {o.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* 표 머리 (넓은 화면) */}
      <div className={cn("relative hidden items-center gap-3 border-y border-border bg-muted/60 py-2.5 pr-6 pl-12 text-xs font-medium text-muted-foreground lg:grid", TABLE_COLUMNS)}>
        {/* 보이는 줄 전체 고르기 (D-66) */}
        {rows.length > 0 && (
          <input
            type="checkbox"
            aria-label="보이는 공고 모두 고르기"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((p) => p.id)))}
            className="absolute top-1/2 left-5 size-4 -translate-y-1/2 accent-primary"
          />
        )}
        <span>기업 · 직무</span>
        <span>진행 단계</span>
        <span>상태</span>
        <span>마감</span>
        <span>우선순위</span>
        <span>근로형태</span>
        <span className="sr-only">단계 넘기기</span>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
          {postings.length === 0 ? <Mascot pose="sit" size={104} hop /> : <Mascot pose="understand" size={80} />}
          <p className="text-sm text-muted-foreground">
            {postings.length === 0 ? "첫 공고를 넣어 보세요" : filtering ? "조건에 맞는 공고가 없어요" : "이 상태의 공고가 없어요"}
          </p>
          {filtering ? (
            <Button variant="outline" size="sm" onClick={() => { setPriorityFilter([]); setTypeFilter([]); }}>
              걸러 보기 지우기
            </Button>
          ) : postings.length === 0 ? (
            <Button size="lg" asChild>
              <Link href="/app/new">공고 넣기</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <ul
          className={cn("flex flex-col divide-y divide-border pb-2", dragging && "cursor-default select-none")}
          onClickCapture={(e) => {
            // 드래그로 고른 직후에는 줄을 눌러 상세로 가지 않는다
            if (suppressClick.current) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          {rows.map((posting, index) => {
            const current = currentStepIndex(posting.steps);
            const step = current === -1 ? null : posting.steps[current];
            const days = allDaysLeft[posting.id] ?? null;
            const priority = PRIORITIES.find((p) => p.value === posting.priority) ?? PRIORITIES[1];
            // 끝낸 단계 없이 마감이 지난 공고는 흐리게 (D-44·D-46)
            const missed = days !== null && days < 0 && posting.steps.every((s) => s.completedAt === null);
            const dim = missed && "opacity-50";
            const isSelected = selected.has(posting.id);
            return (
              <li
                key={posting.id}
                onPointerDown={(e) => onRowPointerDown(e, index)}
                onPointerEnter={() => onRowPointerEnter(index)}
                className={cn(
                  "group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 py-3 transition-colors hover:bg-muted/50 md:px-6 lg:pl-12",
                  TABLE_COLUMNS,
                  posting.id === highlightId && "bg-accent",
                  isSelected && "bg-primary-soft hover:bg-primary-soft",
                )}
              >
                {/* 줄 고르기 체크 (컴퓨터 화면, 마우스를 올리거나 고른 게 있으면 보임) (D-66) */}
                <input
                  type="checkbox"
                  aria-label={`${posting.company} 고르기`}
                  checked={isSelected}
                  onChange={() => toggleSelected(posting.id)}
                  className={cn(
                    "absolute top-1/2 left-5 z-20 hidden size-4 -translate-y-1/2 accent-primary lg:block",
                    hasSelection ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                  )}
                />
                {/* 기업 · 직무 (줄 전체를 누르면 상세로) */}
                <div className={cn("min-w-0", dim)}>
                  <Link
                    href={href(`/app/postings/${posting.id}`)}
                    draggable={false}
                    className="block truncate text-sm font-semibold after:absolute after:inset-0"
                  >
                    {posting.company}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {posting.jobTitle}
                    {posting.isSample && <span className="ml-1.5 text-warning-foreground">· 연습용 예시</span>}
                  </p>
                </div>

                {/* 휴대폰: 상태·마감은 오른쪽 위에 */}
                <div className={cn("flex flex-col items-end gap-1 lg:hidden", dim)}>
                  <StatusMenu posting={posting} days={days} onPick={(t) => moveTo(posting, t)} />
                  <span className="text-xs text-muted-foreground tabular-nums">{formatShortDeadline(posting)}</span>
                </div>

                {/* 진행 단계 */}
                <div className="col-span-2 flex min-w-0 items-center gap-2 lg:col-span-1">
                  <div className={cn("flex min-w-0 flex-col items-start gap-1", dim)}>
                    <div className="hidden w-full lg:@[60rem]:block">
                      <StepDots steps={posting.steps} current={current} />
                    </div>
                    <span className="truncate text-xs text-muted-foreground">{step ? step.name : "전형 끝"}</span>
                  </div>
                  {/* 지금 단계 끝내기: 진행 단계 바로 옆 둥근 체크 (2026-11-12) */}
                  {step && <StepDoneButton stepName={step.name} onClick={() => handleComplete(posting, current)} />}
                </div>

                <div className={cn("hidden lg:block", dim)}>
                  <StatusMenu posting={posting} days={days} onPick={(t) => moveTo(posting, t)} />
                </div>
                <span className={cn("hidden text-sm tabular-nums lg:block", dim)}>{formatShortDeadline(posting)}</span>

                {/* 우선순위 · 근로형태 · 단계 넘기기 (휴대폰은 한 줄에) */}
                <div className="col-span-2 flex items-center gap-1.5 lg:contents">
                  <div className={cn("lg:min-w-0", dim)}>
                    <PickMenu
                      label="우선순위"
                      value={posting.priority}
                      display={priority.label}
                      chipClassName={PRIORITY_CHIP[posting.priority]}
                      options={PRIORITIES}
                      onPick={(v) => saveMeta(posting, { priority: v as Priority })}
                    />
                  </div>
                  <div className={cn("min-w-0", dim)}>
                    <PickMenu
                      label="근로형태"
                      value={typeOf(posting)}
                      display={typeOf(posting)}
                      options={[...typeOptions.filter((o) => o.value !== NO_TYPE), { value: NO_TYPE, label: NO_TYPE }]}
                      onPick={(v) => saveMeta(posting, { employmentType: v === NO_TYPE ? null : v })}
                    />
                  </div>
                  <div className="ml-auto flex items-center gap-1 lg:ml-0 lg:justify-self-end">
                    {!step && (
                      <Button variant="ghost" size="sm" className="relative z-10" onClick={() => handleBack(posting)}>
                        <Undo2 data-icon="inline-start" />
                        이전 단계로
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="relative z-10" aria-label={`${posting.company} 더 보기`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onSelect={() => setEditing(posting)}>
                          <Pencil />
                          편집
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(posting)}>
                          <Trash2 />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>공고 편집</DialogTitle>
            <DialogDescription>준비 항목은 공고 상세의 [수정]에서 바꿔요.</DialogDescription>
          </DialogHeader>
          {editing && <PostingEditForm key={editing.id} posting={editing} onSave={saveEdit} onCancel={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={bulkDeleting} onOpenChange={(open) => !open && !removing && setBulkDeleting(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>고른 공고 {selectedRows.length}개를 지울까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRows.slice(0, 3).map((p) => p.company).join(", ")}
              {selectedRows.length > 3 && ` 외 ${selectedRows.length - 3}개`} — 전형 단계·준비 항목·할 일도 함께 지워지고 되돌릴 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removing}
              onClick={(e) => {
                e.preventDefault();
                bulkDelete();
              }}
            >
              {removing ? "지우는 중…" : `${selectedRows.length}개 지우기`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && !removing && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleting?.company} 공고를 지울까요?</AlertDialogTitle>
            <AlertDialogDescription>전형 단계·준비 항목·할 일도 함께 지워지고 되돌릴 수 없어요.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removing}
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              {removing ? "지우는 중…" : "지우기"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
