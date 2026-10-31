"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeadlineBadge } from "@/components/postings/posting-card";
import { cn } from "@/lib/utils";
import { kstDateKey, type Posting } from "@/lib/postings";
import { loadPostings } from "@/lib/practice-store";

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

export function PostingCalendar({ initialPostings, today }: { initialPostings: Posting[]; today: string }) {
  const [postings, setPostings] = useState(initialPostings);
  const [month, setMonth] = useState({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) });
  const [selected, setSelected] = useState(today);

  // 이 탭에 연습용으로 저장된 공고로 바꾼다
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 저장소는 화면을 그린 뒤에만 읽을 수 있다
    setPostings(loadPostings(initialPostings));
  }, [initialPostings]);

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
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3" aria-label="월 달력">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-lg" onClick={() => moveMonth(-1)} aria-label="이전 달">
              <ChevronLeft />
            </Button>
            <h2 className="min-w-28 text-center text-base font-semibold tabular-nums" aria-live="polite">
              {month.year}년 {month.month}월
            </h2>
            <Button variant="ghost" size="icon-lg" onClick={() => moveMonth(1)} aria-label="다음 달">
              <ChevronRight />
            </Button>
          </div>
          {!isThisMonth && (
            <Button variant="outline" size="lg" onClick={() => goTo(today)}>
              오늘
            </Button>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-7 border-b border-border bg-muted/50">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={cn(
                  "py-2 text-center text-xs font-medium text-muted-foreground",
                  i === 0 && "text-destructive",
                )}
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((key, i) => {
              const border = cn(i % 7 !== 6 && "border-r", i < cells.length - 7 && "border-b", "border-border");
              if (!key) return <div key={`empty-${i}`} className={cn("min-h-14 bg-muted/30 md:min-h-24", border)} />;
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
                    "flex min-h-14 flex-col items-center gap-1 p-1 text-left transition-colors hover:bg-muted md:min-h-24 md:items-stretch md:p-1.5",
                    border,
                    isSelected && "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                      i % 7 === 0 && "text-destructive",
                      isToday && "bg-primary font-semibold text-primary-foreground",
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
                              isUrgent(p, today) ? "bg-destructive" : "bg-foreground/40",
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
                              isApplied(p) && "text-muted-foreground line-through",
                            )}
                          >
                            {isUrgent(p, today) && <span className="size-1.5 shrink-0 rounded-full bg-destructive" />}
                            <span className="truncate">{p.company}</span>
                          </span>
                        ))}
                        {items.length > 2 && (
                          <span className="text-[11px] leading-4 text-muted-foreground">+{items.length - 2}</span>
                        )}
                      </span>
                    </>
                  )}
                  {urgent && <span className="sr-only">마감 임박</span>}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {postings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">공고를 저장하면 마감일이 여기에 표시돼요</p>
          <Button size="lg" asChild>
            <Link href="/app/new">
              <Plus data-icon="inline-start" />
              공고 넣기
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-[13px] font-semibold text-muted-foreground">{formatDay(selected)} 마감</h2>
            {selectedPostings.length === 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">이날 마감인 공고가 없어요</p>
                {nextKey && (
                  <Button variant="outline" size="lg" onClick={() => goTo(nextKey)}>
                    다음 마감 {formatDay(nextKey)}
                    <ChevronRight data-icon="inline-end" />
                  </Button>
                )}
              </div>
            ) : (
              <PostingRows postings={selectedPostings} today={today} />
            )}
          </section>

          {noDate.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-[13px] font-semibold text-muted-foreground">
                상시 모집 <span className="tabular-nums">{noDate.length}</span>개
              </h2>
              <PostingRows postings={noDate} today={today} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function PostingRows({ postings, today }: { postings: Posting[]; today: string }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {postings.map((posting) => {
        const key = deadlineKey(posting);
        return (
          <li key={posting.id}>
            <Link
              href={`/app/postings/${posting.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{posting.company}</p>
                <p className="truncate text-xs text-muted-foreground">{posting.jobTitle}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {posting.isSample && <span className="text-[11px] text-warning-foreground">연습용 예시</span>}
                <DeadlineBadge posting={posting} daysLeft={key ? daysBetween(today, key) : null} />
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
