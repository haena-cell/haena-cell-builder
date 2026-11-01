"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { DateBlock, DeadlineBadge } from "@/components/postings/posting-card";
import { deadlineKey, isUrgent, monthCells, WEEKDAYS } from "@/components/postings/posting-calendar";
import { DueChip } from "@/components/postings/prep-todos";
import { StepDots } from "@/components/postings/step-bar";
import { setPrepDone, updateSubtask } from "@/lib/posting-actions";
import { currentStepIndex, type Posting } from "@/lib/postings";
import { cn } from "@/lib/utils";

// 홈 (D-25): 마감 임박 공고 4개 · 이번 달 달력 · 남은 할 일 5개. 전체는 각 화면에서

const DAY_MS = 24 * 60 * 60 * 1000;
const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);

function PanelHead({ title, href, children }: { title: React.ReactNode; href: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">{title}{children}</h2>
      <Link href={href} className="flex shrink-0 items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground">
        전체 보기
        <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}

type TodoRow = { key: string; kind: "item" | "sub"; id: string; label: string; done: boolean; dueDate: string | null; posting: Posting };

export function HomeDashboard({ initialPostings, today }: { initialPostings: Posting[]; today: string }) {
  const [postings, setPostings] = useState(initialPostings);
  const active = postings.filter((p) => currentStepIndex(p.steps) !== -1);
  const daysOf = (p: Posting) => {
    const key = deadlineKey(p);
    return key ? daysBetween(today, key) : null;
  };

  // 마감 임박: 아직 안 낸 공고 중 마감이 안 지난 것, 마감이 빠른 순
  const upcoming = active
    .filter((p) => !p.steps[0]?.completedAt && (daysOf(p) ?? -1) >= 0)
    .sort((a, b) => (daysOf(a) ?? 0) - (daysOf(b) ?? 0));

  // 체크하면 바로 사라지지 않고 줄을 그은 채 남겨 둔다 (실수로 눌렀을 때 다시 풀 수 있게)
  const [justDone, setJustDone] = useState<Set<string>>(new Set());

  // 할 일: 안 끝낸 준비 항목·하위 할 일, 할 일 마감일 → 공고 마감 순
  const todos: TodoRow[] = active
    .flatMap((p) =>
      p.prepItems.flatMap((it) => [
        { key: `i-${it.id}`, kind: "item" as const, id: it.id, label: it.label, done: it.done, dueDate: it.dueDate, posting: p },
        ...it.subtasks.map((t) => ({ key: `s-${t.id}`, kind: "sub" as const, id: t.id, label: t.label, done: t.done, dueDate: t.dueDate, posting: p })),
      ]),
    )
    .filter((r) => !r.done || justDone.has(r.key))
    .sort(
      (a, b) =>
        (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31") ||
        (daysOf(a.posting) ?? Infinity) - (daysOf(b.posting) ?? Infinity),
    );
  const shownTodos = todos.slice(0, 5);
  const remaining = todos.filter((r) => !r.done).length;

  function patch(row: TodoRow, done: boolean) {
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

  const mark = (key: string, on: boolean) =>
    setJustDone((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  async function toggle(row: TodoRow) {
    const done = !row.done;
    patch(row, done);
    if (done) mark(row.key, true);
    const result = row.kind === "item" ? await setPrepDone(row.id, done) : await updateSubtask(row.id, { done });
    if (!result.ok) {
      patch(row, !done);
      toast.error(result.message);
    }
  }

  // 이번 달 달력
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const byDate = new Map<string, Posting[]>();
  for (const p of postings) {
    const key = deadlineKey(p);
    if (key) byDate.set(key, [...(byDate.get(key) ?? []), p]);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-4 px-3 md:px-6" aria-label="마감 임박">
        <PanelHead title="마감 임박" href="/app/postings" />
        {upcoming.length === 0 ? (
          <p className="rounded-2xl bg-muted px-4 py-4 text-sm text-muted-foreground">마감을 앞둔 공고가 없어요</p>
        ) : (
          <ul className="grid gap-3 xl:grid-cols-2">
            {upcoming.slice(0, 4).map((p) => {
              const current = currentStepIndex(p.steps);
              return (
                <li key={p.id}>
                  <Link
                    href={`/app/postings/${p.id}`}
                    className="flex items-stretch gap-3 rounded-[20px] border border-border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex w-12 shrink-0 flex-col items-center justify-center border-r border-border pr-3">
                      <DateBlock posting={p} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{p.company}</p>
                          <p className="truncate text-xs text-muted-foreground">{p.jobTitle}</p>
                        </div>
                        <DeadlineBadge posting={p} daysLeft={daysOf(p)} />
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <StepDots steps={p.steps} current={current} />
                        <span className="truncate text-xs text-muted-foreground">{p.steps[current]?.name}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card className="gap-3 px-3 md:px-6" aria-label="이번 달 달력">
          <PanelHead title={<>{month}월 <span className="text-muted-foreground">{year}</span></>} href="/app/calendar" />
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w, i) => (
              <span key={w} className={cn("py-1 text-center text-[11px] text-muted-foreground", i === 0 && "text-destructive")}>
                {w}
              </span>
            ))}
            {monthCells(year, month).map((key, i) => {
              if (!key) return <span key={`empty-${i}`} />;
              const items = byDate.get(key) ?? [];
              const isToday = key === today;
              return (
                <Link
                  key={key}
                  href="/app/calendar"
                  aria-label={`${Number(key.slice(8))}일${items.length ? `, 마감 공고 ${items.length}개` : ""}`}
                  className={cn(
                    "relative flex h-10 items-center justify-center rounded-xl bg-muted text-xs tabular-nums transition-colors hover:bg-accent",
                    isToday && "bg-primary font-bold text-primary-foreground hover:bg-primary",
                  )}
                >
                  {items.length > 0 && (
                    <span
                      className={cn(
                        "absolute top-1 size-1 rounded-full",
                        items.some((p) => isUrgent(p, today)) ? "bg-destructive" : isToday ? "bg-primary-foreground" : "bg-foreground/50",
                      )}
                    />
                  )}
                  {Number(key.slice(8))}
                </Link>
              );
            })}
          </div>
        </Card>

        <Card className="gap-3 px-3 md:px-6" aria-label="할 일">
          <PanelHead title="할 일" href="/app/todos">
            {remaining > 0 && <span className="rounded-full bg-secondary px-2 text-xs font-medium tabular-nums">{remaining}</span>}
          </PanelHead>
          {shownTodos.length === 0 ? (
            <p className="rounded-2xl bg-muted px-4 py-4 text-sm text-muted-foreground">남은 할 일이 없어요</p>
          ) : (
            <ul className="flex flex-col rounded-2xl bg-muted px-3 py-1.5">
              {shownTodos.map((row) => (
                <li key={row.key} className="flex items-center gap-2.5 py-2">
                  <input
                    type="checkbox"
                    checked={row.done}
                    onChange={() => toggle(row)}
                    aria-label={`${row.label} ${row.done ? "체크 풀기" : "체크"}`}
                    className="size-4 shrink-0 accent-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm", row.done && "text-muted-foreground line-through")}>{row.label}</p>
                    <Link href={`/app/postings/${row.posting.id}`} className="block truncate text-xs text-muted-foreground hover:underline">
                      {row.posting.company}
                    </Link>
                  </div>
                  {row.dueDate && <DueChip value={row.dueDate} done={row.done} today={today} />}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
