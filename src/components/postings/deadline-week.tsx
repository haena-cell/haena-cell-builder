"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_MS = 86_400_000;
const toKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// 공고 상세의 마감: 마감일이 든 한 주만 보여 주고, 전주·다음 주로 넘겨 볼 수 있다 (D-48). 날짜는 한국 날짜(YYYY-MM-DD)
export function DeadlineWeek({ deadline, today }: { deadline: string; today: string }) {
  const [offset, setOffset] = useState(0);
  const base = Date.parse(`${deadline}T00:00:00Z`);
  const sunday = base - new Date(base).getUTCDay() * DAY_MS + offset * 7 * DAY_MS;
  const days = WEEKDAYS.map((_, i) => toKey(sunday + i * DAY_MS));
  const first = days[0];
  const last = days[6];
  const label = (key: string) => `${Number(key.slice(5, 7))}월`;
  const title = `${first.slice(0, 4)}년 ${label(first)}${label(first) !== label(last) ? ` – ${last.slice(0, 4) !== first.slice(0, 4) ? `${last.slice(0, 4)}년 ` : ""}${label(last)}` : ""}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold tabular-nums" aria-live="polite">{title}</p>
        <div className="flex items-center gap-1">
          {offset !== 0 && (
            <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => setOffset(0)}>마감 주로</Button>
          )}
          <Button type="button" variant="ghost" size="icon-sm" aria-label="전주" onClick={() => setOffset((o) => o - 1)}><ChevronLeft /></Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="다음 주" onClick={() => setOffset((o) => o + 1)}><ChevronRight /></Button>
        </div>
      </div>
      <ol className="grid grid-cols-7 gap-1">
        {days.map((key, i) => {
          const isDeadline = key === deadline;
          const isToday = key === today;
          return (
            <li
              key={key}
              aria-current={isDeadline ? "date" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl bg-muted py-2 text-sm tabular-nums",
                isToday && "ring-1 ring-foreground",
                isDeadline && "bg-primary font-bold text-primary-foreground",
              )}
            >
              <span className={cn("text-[11px] text-muted-foreground", isDeadline && "text-primary-foreground")}>{WEEKDAYS[i]}</span>
              {Number(key.slice(8))}
              <span className="h-3.5 text-[10px] leading-3.5 font-medium">{isDeadline ? "마감" : isToday ? "오늘" : ""}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
