"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// 브라우저 기본 날짜·시각 창 대신 쓰는 고르기 (2026-11-12 사용자 요청 "캘린더랑 시간을 선택하는 창이 못생겼어요", D-69)
// 값은 지금과 같은 글자: 날짜 "YYYY-MM-DD", 시각 "HH:MM" (없으면 빈 글자)

const toDate = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
};
const toKey = (date: Date) => format(date, "yyyy-MM-dd");
const todayKey = () => toKey(new Date());

// 달력 판: 날짜를 누르면 고르고 닫힌다. 아래 [오늘] · [지우기]
export function DatePanel({ value, onPick, onClear }: { value: string; onPick: (key: string) => void; onClear?: () => void }) {
  const selected = value ? toDate(value) : undefined;
  return (
    <div className="flex flex-col">
      <Calendar
        mode="single"
        locale={ko}
        selected={selected}
        defaultMonth={selected}
        onSelect={(date) => date && onPick(toKey(date))}
        className="[--cell-size:--spacing(9)]"
        formatters={{ formatCaption: (date) => format(date, "yyyy년 M월", { locale: ko }) }}
      />
      <div className="flex items-center justify-between gap-2 border-t border-border-subtle px-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => onPick(todayKey())}>
          오늘
        </Button>
        {onClear && value && (
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={onClear}>
            지우기
          </Button>
        )}
      </div>
    </div>
  );
}

const triggerClass =
  "h-10 w-full justify-start gap-2 rounded-md border-input bg-card px-3 text-sm font-normal text-foreground hover:bg-card hover:border-primary aria-expanded:border-primary aria-expanded:ring-1 aria-expanded:ring-primary";

// 날짜 칸: 눌러서 달력 판을 연다
export function DatePicker({
  value,
  onChange,
  placeholder = "날짜 고르기",
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? toDate(value) : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" aria-label={ariaLabel} className={cn(triggerClass, className)}>
          <CalendarDays className="size-4 text-muted-foreground" />
          {date ? format(date, "yyyy. M. d (EEE)", { locale: ko }) : <span className="text-muted-foreground">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <DatePanel
          value={value}
          onPick={(key) => {
            onChange(key);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINUTES = ["00", "10", "15", "20", "30", "40", "45", "50", "59"];
const QUICK = ["10:00", "18:00", "23:59"];

const label = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return `${h < 12 ? "오전" : "오후"} ${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")}`;
};

// 시각 칸: 눌러서 시·분을 고른다. 마감 시각이 없는 공고가 많아 [시각 없음]이 있다
export function TimePicker({
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [h, m] = value ? value.split(":") : ["", ""];
  // 열 때 고른 시·분(없으면 18시) 쪽으로 미리 굴려 둔다
  const hourList = useRef<HTMLDivElement>(null);
  const minuteList = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      for (const [list, key] of [[hourList, h || "18"], [minuteList, m || "00"]] as const) {
        const el = list.current?.querySelector<HTMLElement>(`[data-v="${key}"]`);
        if (el && list.current) list.current.scrollTop = el.offsetTop - list.current.offsetTop - 64;
      }
    });
    return () => cancelAnimationFrame(id);
  }, [open, h, m]);
  const pick = (hour: string, minute: string) => onChange(`${hour}:${minute}`);
  const cell = (on: boolean) =>
    cn(
      "h-8 w-full shrink-0 rounded-sm text-sm tabular-nums transition-colors",
      on ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-muted",
    );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" aria-label={ariaLabel} className={cn(triggerClass, className)}>
          <Clock className="size-4 text-muted-foreground" />
          {value ? label(value) : <span className="text-muted-foreground">시각 없음</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-2">
        <div className="flex flex-wrap gap-1 pb-2">
          {QUICK.map((q) => (
            <Button
              key={q}
              type="button"
              variant="outline"
              size="sm"
              className={cn("h-7 px-2 text-xs", value === q && "border-primary bg-primary-soft")}
              onClick={() => {
                onChange(q);
                setOpen(false);
              }}
            >
              {label(q)}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-border-subtle pt-2">
          <div className="flex flex-col gap-0.5">
            <p className="px-1 pb-1 text-xs text-muted-foreground">시</p>
            <div ref={hourList} className="flex max-h-52 flex-col gap-0.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {HOURS.map((hour) => (
                <button key={hour} data-v={hour} type="button" className={cell(hour === h)} onClick={() => pick(hour, m || "00")}>
                  {hour}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="px-1 pb-1 text-xs text-muted-foreground">분</p>
            <div ref={minuteList} className="flex max-h-52 flex-col gap-0.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {MINUTES.map((minute) => (
                <button
                  key={minute}
                  data-v={minute}
                  type="button"
                  className={cell(minute === m)}
                  onClick={() => {
                    pick(h || "18", minute);
                    setOpen(false);
                  }}
                >
                  {minute}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2 flex justify-end border-t border-border-subtle pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            시각 없음
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
