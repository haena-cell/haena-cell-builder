"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DateBlock, DeadlineBadge } from "@/components/postings/posting-card";
import { cn } from "@/lib/utils";
import { kstDateKey, type Posting } from "@/lib/postings";

// 날짜 칸 하나는 한국 시간 날짜 문자열(YYYY-MM-DD)로 다룬다.
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`;
const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);

function deadlineKey(posting: Posting) {
  return posting.deadlineKind === "date" && posting.deadlineAt ? kstDateKey(new Date(posting.deadlineAt)) : null;
}

const isApplied = (posting: Posting) => posting.steps[0]?.completedAt != null;

// 아직 안 낸 공고 중 마감까지 3일 이내
function isUrgent(posting: Posting, today: string) {
  const key = deadlineKey(posting);
  if (!key || isApplied(posting)) return false;
  const days = daysBetween(today, key);
  return days >= 0 && days <= 3;
}

// 그 달을 일요일부터 시작하는 주 단위 칸으로. 다른 달 칸은 null.
function monthCells(year: number, month: number) {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = Array(firstWeekday).fill(null);
  for (let day = 1; day <= lastDay; day++) cells.push(toKey(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatDay(key: string) {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "UTC", month: "long", day: "numeric", weekday: "short" }).format(
    new Date(`${key}T00:00:00Z`),
  );
}

export function PostingCalendar({ postings, today }: { postings: Posting[]; today: string }) {
  const [month, setMonth] = useState({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) });
  const [selected, setSelected] = useState(today);

  const byDate = new Map<string, Posting[]>();
  const noDate: Posting[] = [];
  for (const posting of postings) {
    const key = deadlineKey(posting);
    if (!key) {
      noDate.push(posting);
      continue;
    }
    byDate.set(key, [...(byDate.get(key) ?? []), posting]);
  }

  function moveMonth(delta: number) {
    const d = new Date(Date.UTC(month.year, month.month - 1 + delta, 1));
    setMonth({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 });
  }

  const cells = monthCells(month.year, month.month);
  const isThisMonth = today.startsWith(toKey(month.year, month.month, 1).slice(0, 7));
  const selectedPostings = byDate.get(selected) ?? [];
  // 고른 날 뒤로 가장 가까운 마감일 (빈 날을 골랐을 때 바로 옮겨 가도록)
  const nextKey = [...byDate.keys()].filter((k) => k > selected).sort()[0] ?? null;

  function goTo(key: string) {
    setMonth({ year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)) });
    setSelected(key);
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <Card className="gap-4 px-3 md:px-6" aria-label="월 달력">
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className="text-lg font-bold tracking-tight tabular-nums" aria-live="polite">
            {month.month}월 <span className="text-muted-foreground">{month.year}</span>
          </h2>
          <div className="flex items-center gap-1">
            {!isThisMonth && (
              <Button variant="outline" size="sm" onClick={() => goTo(today)}>
                오늘
              </Button>
            )}
            <Button variant="ghost" size="icon-lg" onClick={() => moveMonth(-1)} aria-label="이전 달">
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon-lg" onClick={() => moveMonth(1)} aria-label="다음 달">
              <ChevronRight />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-1.5">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={cn(
                "rounded-full bg-muted py-1 text-center text-xs font-medium text-muted-foreground",
                i === 0 && "text-destructive",
              )}
            >
              {w}
            </div>
          ))}
          {cells.map((key, i) => {
            if (!key) return <div key={`empty-${i}`} />;
            const items = byDate.get(key) ?? [];
            const urgent = items.some((p) => isUrgent(p, today));
            const isSelected = key === selected;
            const isToday = key === today;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                aria-pressed={isSelected}
                aria-label={`${formatDay(key)}${items.length ? `, 마감 공고 ${items.length}개` : ""}`}
                className={cn(
                  "flex min-h-12 flex-col items-center gap-1 rounded-xl bg-muted p-1 text-left transition-colors hover:bg-accent md:min-h-20 md:items-stretch md:p-1.5",
                  isToday && !isSelected && "ring-1 ring-foreground",
                  isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                )}
              >
                <span
                  className={cn(
                    "text-xs tabular-nums md:px-0.5",
                    i % 7 === 0 && !isSelected && "text-destructive",
                    (isToday || isSelected) && "font-bold",
                  )}
                >
                  {Number(key.slice(8))}
                </span>

                {/* 휴대폰: 점만 / 넓은 화면: 기업명 2개까지 + "+n" */}
                {items.length > 0 && (
                  <>
                    <span className="flex gap-0.5 md:hidden" aria-hidden>
                      {items.slice(0, 3).map((p) => (
                        <span
                          key={p.id}
                          className={cn(
                            "size-1.5 rounded-full",
                            isUrgent(p, today) ? "bg-destructive" : isSelected ? "bg-primary-foreground" : "bg-foreground/50",
                          )}
                        />
                      ))}
                    </span>
                    <span className="hidden flex-col gap-0.5 md:flex" aria-hidden>
                      {items.slice(0, 2).map((p) => (
                        <span
                          key={p.id}
                          className={cn(
                            "flex items-center gap-1 truncate text-[11px] leading-4",
                            isApplied(p) && "line-through opacity-60",
                          )}
                        >
                          {isUrgent(p, today) && <span className="size-1.5 shrink-0 rounded-full bg-destructive" />}
                          <span className="truncate">{p.company}</span>
                        </span>
                      ))}
                      {items.length > 2 && (
                        <span className="text-[11px] leading-4 opacity-60">+{items.length - 2}</span>
                      )}
                    </span>
                  </>
                )}
                {urgent && <span className="sr-only">마감 임박</span>}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        {postings.length === 0 ? (
          <Card className="items-center px-4 py-10 text-center md:px-6">
            <p className="text-sm text-muted-foreground">공고를 저장하면 마감일이 여기에 표시돼요</p>
            <Button size="lg" asChild>
              <Link href="/app/new">
                <Plus data-icon="inline-start" />
                공고 넣기
              </Link>
            </Button>
          </Card>
        ) : (
          <>
            <Card className="gap-3 px-3 md:px-6">
              <h2 className="px-1 text-lg font-bold tracking-tight">{formatDay(selected)} 마감</h2>
              {selectedPostings.length === 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-muted px-4 py-3">
                  <p className="text-sm text-muted-foreground">이날 마감인 공고가 없어요</p>
                  {nextKey && (
                    <Button variant="outline" size="sm" onClick={() => goTo(nextKey)}>
                      다음 마감 {formatDay(nextKey)}
                      <ChevronRight data-icon="inline-end" />
                    </Button>
                  )}
                </div>
              ) : (
                <PostingRows postings={selectedPostings} today={today} />
              )}
            </Card>

            {noDate.length > 0 && (
              <Card className="gap-3 px-3 md:px-6">
                <h2 className="flex items-center gap-2 px-1 text-lg font-bold tracking-tight">
                  상시 모집
                  <Badge variant="secondary" className="tabular-nums">{noDate.length}</Badge>
                </h2>
                <PostingRows postings={noDate} today={today} />
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PostingRows({ postings, today }: { postings: Posting[]; today: string }) {
  return (
    <ul className="flex flex-col gap-2">
      {postings.map((posting) => {
        const key = deadlineKey(posting);
        return (
          <li key={posting.id}>
            <Link
              href={`/app/postings/${posting.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border p-3 transition-colors hover:bg-muted"
            >
              <div className="flex w-12 shrink-0 flex-col items-center border-r border-border pr-3">
                <DateBlock posting={posting} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{posting.company}</p>
                <p className="truncate text-xs text-muted-foreground">{posting.jobTitle}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {posting.isSample && <Badge variant="warning">연습용 예시</Badge>}
                  <DeadlineBadge posting={posting} daysLeft={key ? daysBetween(today, key) : null} />
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
