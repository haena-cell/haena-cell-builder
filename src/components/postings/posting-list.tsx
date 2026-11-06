"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, ListFilter, MoreHorizontal, Pencil, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
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
import { StepDots } from "@/components/postings/step-bar";
import {
  currentStepIndex,
  daysLeftFor,
  EMPLOYMENT_TYPES,
  isSubmitStep,
  kstDateKey,
  PRIORITIES,
  withCurrentStep,
  type Posting,
  type Priority,
} from "@/lib/postings";
import { cn } from "@/lib/utils";

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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn(active && "border-primary bg-primary text-primary-foreground hover:bg-primary/85 hover:text-primary-foreground aria-expanded:bg-primary aria-expanded:text-primary-foreground")}>
          {label}
          {active && <span className="tabular-nums">{selected.length}</span>}
          <ChevronDown data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
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
            "relative z-10 inline-flex h-7 max-w-full items-center gap-1 rounded-full px-2.5 text-xs font-medium transition-opacity hover:opacity-80",
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
  const { deletePosting, setCurrentStep, setStepCompleted: setStepCompletedAction, updatePosting, updatePostingMeta } = usePostingActions();
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
    toast(`${posting.company} · ${posting.steps[stepIndex].name} 완료`, {
      action: { label: "되돌리기", onClick: () => saveStep(posting, stepIndex, false) },
    });
  }

  // 전형 끝 → 마지막 단계로 되돌리기
  async function handleBack(posting: Posting) {
    const target = posting.steps.length - 1;
    const before = posting.steps;
    replace(posting.id, (p) => ({ ...p, steps: withCurrentStep(before, target) }));
    const result = await setCurrentStep(posting.id, target);
    if (!result.ok) {
      replace(posting.id, (p) => ({ ...p, steps: before }));
      return toast.error(result.message);
    }
    toast(`${posting.company} · 지금 단계: ${posting.steps[target].name}`);
  }

  async function saveMeta(posting: Posting, meta: { priority?: Priority; employmentType?: string | null }) {
    const before = posting;
    replace(posting.id, (p) => ({ ...p, ...meta }));
    const result = await updatePostingMeta(posting.id, meta);
    if (!result.ok) {
      replace(posting.id, () => before);
      toast.error(result.message);
    }
  }

  async function saveEdit(next: Posting) {
    const result = await updatePosting(next.id, next);
    if (!result.ok) return result.message;
    replace(next.id, () => next);
    setEditing(null);
    toast("고친 내용을 저장했어요");
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
  // 상태 순서(마감 임박 → … → 지난 공고) 안에서 마감이 빠른 순, 날짜 없는 공고는 뒤로
  const rows = filtered
    .filter((p) => tab === "all" || statusById[p.id] === tab)
    .sort(
      (a, b) =>
        STATUS_ORDER.indexOf(statusById[a.id]) - STATUS_ORDER.indexOf(statusById[b.id]) ||
        (allDaysLeft[a.id] ?? Infinity) - (allDaysLeft[b.id] ?? Infinity),
    );
  const filtering = priorityFilter.length > 0 || typeFilter.length > 0;

  return (
    <Card className="@container gap-0 px-0 py-0 md:px-0 md:py-0">
      {/* 상태 탭 */}
      <div className="flex gap-1 overflow-x-auto border-b border-border px-3 pt-3 md:px-6 md:pt-4" role="tablist" aria-label="상태">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-2.5 pb-3 text-sm text-muted-foreground transition-colors hover:text-foreground",
              tab === t.value && "border-primary font-semibold text-foreground",
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-xs tabular-nums",
                t.value === "urgent" && count(t.value) > 0 ? "bg-destructive-soft text-destructive" : "bg-secondary",
              )}
            >
              {count(t.value)}
            </span>
          </button>
        ))}
      </div>

      {/* 걸러 보기 */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-3 md:px-6">
        <ListFilter className="size-4 text-muted-foreground" aria-hidden />
        <FilterMenu
          label="우선순위"
          options={PRIORITIES}
          selected={priorityFilter}
          onChange={setPriorityFilter}
        />
        <FilterMenu label="근로형태" options={typeOptions} selected={typeFilter} onChange={setTypeFilter} />
        {filtering && (
          <Button variant="ghost" size="sm" onClick={() => { setPriorityFilter([]); setTypeFilter([]); }}>
            걸러 보기 지우기
          </Button>
        )}
      </div>

      {/* 표 머리 (넓은 화면) */}
      <div className={cn("hidden items-center gap-3 border-y border-border bg-muted/60 px-6 py-2.5 text-xs font-medium text-muted-foreground lg:grid", TABLE_COLUMNS)}>
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
        <ul className="flex flex-col divide-y divide-border pb-2">
          {rows.map((posting) => {
            const current = currentStepIndex(posting.steps);
            const step = current === -1 ? null : posting.steps[current];
            const days = allDaysLeft[posting.id] ?? null;
            const priority = PRIORITIES.find((p) => p.value === posting.priority) ?? PRIORITIES[1];
            // 끝낸 단계 없이 마감이 지난 공고는 어둡게 (D-44)
            const missed = days !== null && days < 0 && posting.steps.every((s) => s.completedAt === null);
            const dim = missed && "opacity-70";
            return (
              <li
                key={posting.id}
                className={cn(
                  "relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 py-3 transition-colors hover:bg-muted/50 md:px-6",
                  TABLE_COLUMNS,
                  missed && "bg-foreground/10 hover:bg-foreground/10",
                  posting.id === highlightId && "bg-accent",
                )}
              >
                {/* 기업 · 직무 (줄 전체를 누르면 상세로) */}
                <div className={cn("min-w-0", dim)}>
                  <Link
                    href={href(`/app/postings/${posting.id}`)}
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
                  <DeadlineBadge posting={posting} daysLeft={days} />
                  <span className="text-xs text-muted-foreground tabular-nums">{formatShortDeadline(posting)}</span>
                </div>

                {/* 진행 단계 */}
                <div className={cn("col-span-2 flex min-w-0 flex-col items-start gap-1 lg:col-span-1", dim)}>
                  <div className="hidden w-full lg:@[60rem]:block">
                    <StepDots steps={posting.steps} current={current} />
                  </div>
                  <span className="truncate text-xs text-muted-foreground">{step ? step.name : "전형 끝"}</span>
                </div>

                <div className={cn("hidden lg:block", dim)}>
                  <DeadlineBadge posting={posting} daysLeft={days} />
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
                    {step ? (
                      <Button variant="outline" size="sm" className="relative z-10" onClick={() => handleComplete(posting, current)}>
                        <Check data-icon="inline-start" />
                        {isSubmitStep(step.name) ? "제출 완료" : "다음 단계로"}
                      </Button>
                    ) : (
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>공고 편집</DialogTitle>
            <DialogDescription>전형 단계와 준비 항목은 공고 상세에서 바꿔요.</DialogDescription>
          </DialogHeader>
          {editing && <PostingEditForm key={editing.id} posting={editing} onSave={saveEdit} onCancel={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

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
