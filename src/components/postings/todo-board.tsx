"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DeadlineBadge } from "@/components/postings/posting-card";
import { DueChip } from "@/components/postings/prep-todos";
import { setPrepDone, updateSubtask } from "@/lib/posting-actions";
import { currentStepIndex, kstDateKey, type Posting } from "@/lib/postings";
import { cn } from "@/lib/utils";

// [할 일] 모아보기 (D-20): 모든 공고의 준비 항목·하위 할 일을 마감 임박 공고 순 또는 할 일 마감일 순으로.
// 추가·수정은 공고 상세에서, 여기서는 체크와 공고로 이동.

type Sort = "posting" | "due";
const SORT_KEY = "todos:sort";
const DAY_MS = 24 * 60 * 60 * 1000;

const postingDays = (p: Posting, today: string) =>
  p.deadlineKind === "date" && p.deadlineAt
    ? Math.round((Date.parse(kstDateKey(new Date(p.deadlineAt))) - Date.parse(today)) / DAY_MS)
    : null;

type Row = {
  key: string;
  kind: "item" | "sub";
  id: string;
  label: string;
  done: boolean;
  dueDate: string | null;
  posting: Posting;
  parentId: string | null; // 하위 할 일이면 어느 준비 항목 안인지
  parentLabel: string | null;
};

function Check({ row, onToggle }: { row: Row; onToggle: (row: Row) => void }) {
  return (
    <input
      type="checkbox"
      checked={row.done}
      onChange={() => onToggle(row)}
      aria-label={`${row.label} ${row.done ? "체크 풀기" : "체크"}`}
      className="size-4 shrink-0 accent-primary"
    />
  );
}

export function TodoBoard({ initialPostings, today }: { initialPostings: Posting[]; today: string }) {
  const [postings, setPostings] = useState(initialPostings);
  const [sort, setSort] = useState<Sort>("posting");
  const [showDone, setShowDone] = useState(false);

  // 고른 정렬은 이 브라우저에 기억
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SORT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 저장소는 화면을 그린 뒤에만 읽을 수 있다
      if (saved === "posting" || saved === "due") setSort(saved);
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

  function patch(row: Row, done: boolean) {
    setPostings((prev) =>
      prev.map((p) =>
        p.id !== row.posting.id
          ? p
          : {
              ...p,
              prepItems: p.prepItems.map((it) =>
                row.kind === "item"
                  ? it.id === row.id ? { ...it, done } : it
                  : { ...it, subtasks: it.subtasks.map((t) => (t.id === row.id ? { ...t, done } : t)) },
              ),
            },
      ),
    );
  }

  async function toggle(row: Row) {
    const done = !row.done;
    patch(row, done);
    const result = row.kind === "item" ? await setPrepDone(row.id, done) : await updateSubtask(row.id, { done });
    if (!result.ok) {
      patch(row, !done);
      toast.error(result.message);
    }
  }

  // 전형이 끝난 공고는 뺀다
  const active = postings.filter((p) => currentStepIndex(p.steps) !== -1);
  const rowsOf = (p: Posting): Row[] =>
    p.prepItems.flatMap((it) => [
      { key: `i-${it.id}`, kind: "item" as const, id: it.id, label: it.label, done: it.done, dueDate: it.dueDate, posting: p, parentId: null, parentLabel: null },
      ...it.subtasks.map((t) => ({
        key: `s-${t.id}`,
        kind: "sub" as const,
        id: t.id,
        label: t.label,
        done: t.done,
        dueDate: t.dueDate,
        posting: p,
        parentId: it.id,
        parentLabel: it.label,
      })),
    ]);
  const visible = (row: Row) => showDone || !row.done;
  // 준비 항목은 끝냈어도 안 끝낸 하위 할 일이 있으면 보여 준다
  const visibleInGroup = (rows: Row[], row: Row) =>
    visible(row) || (row.kind === "item" && rows.some((r) => r.parentId === row.id && visible(r)));

  const byPostingDeadline = (a: Posting, b: Posting) =>
    (postingDays(a, today) ?? Infinity) - (postingDays(b, today) ?? Infinity);

  const groups = [...active]
    .sort(byPostingDeadline)
    .map((p) => {
      const rows = rowsOf(p);
      return { posting: p, rows: rows.filter((r) => visibleInGroup(rows, r)) };
    })
    .filter((g) => g.rows.length > 0);

  const flat = active
    .flatMap(rowsOf)
    .filter(visible)
    .sort(
      (a, b) =>
        (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31") || byPostingDeadline(a.posting, b.posting),
    );

  const total = active.flatMap(rowsOf).length;
  const empty = sort === "posting" ? groups.length === 0 : flat.length === 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex rounded-lg bg-muted p-0.5" role="radiogroup" aria-label="정렬">
          {(
            [
              { value: "posting", label: "마감 임박 공고 순" },
              { value: "due", label: "할 일 마감일 순" },
            ] as const
          ).map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={sort === o.value}
              onClick={() => changeSort(o.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors",
                sort === o.value && "bg-background font-semibold text-foreground shadow-sm",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="size-4 accent-primary" />
          완료한 일 보기
        </label>
      </div>

      {empty ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {total === 0 ? "공고 상세의 준비 항목에서 할 일을 추가해 보세요" : "남은 할 일이 없어요"}
          </p>
          <Button variant="outline" size="lg" asChild>
            <Link href="/app">공고 목록으로</Link>
          </Button>
        </div>
      ) : sort === "posting" ? (
        <div className="flex flex-col gap-4">
          {groups.map(({ posting, rows }) => (
            <section key={posting.id} className="overflow-hidden rounded-xl border border-border">
              <Link
                href={`/app/postings/${posting.id}`}
                className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2.5 hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{posting.company}</p>
                  <p className="truncate text-xs text-muted-foreground">{posting.jobTitle}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <DeadlineBadge posting={posting} daysLeft={postingDays(posting, today)} />
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </Link>
              <ul className="flex flex-col px-4 py-2">
                {rows.map((row) => (
                  <li key={row.key} className={cn("flex items-center gap-2.5 py-1.5", row.kind === "sub" && "ml-6")}>
                    <Check row={row} onToggle={toggle} />
                    <span className={cn("min-w-0 flex-1 text-sm", row.done && "text-muted-foreground line-through")}>
                      {row.label}
                    </span>
                    {row.dueDate && <DueChip value={row.dueDate} done={row.done} today={today} />}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border px-4">
          {flat.map((row) => (
            <li key={row.key} className="flex items-center gap-2.5 py-2.5">
              <Check row={row} onToggle={toggle} />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", row.done && "text-muted-foreground line-through")}>{row.label}</p>
                <Link href={`/app/postings/${row.posting.id}`} className="block truncate text-xs text-muted-foreground hover:underline">
                  {row.posting.company}
                  {row.parentLabel && ` · ${row.parentLabel}`}
                </Link>
              </div>
              {row.dueDate ? (
                <DueChip value={row.dueDate} done={row.done} today={today} />
              ) : (
                <span className="shrink-0 text-xs text-muted-foreground">날짜 없음</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
