import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// 화면을 불러오는 동안 보이는 뼈대 (D-63). 실제 화면과 같은 자리에 같은 크기로 놓아 바뀔 때 덜 튄다

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

function Loading({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    // 금방 끝나는 로딩에서는 뼈대가 번쩍이지 않게 0.15초 기다렸다가 서서히 나타난다
    <div role="status" aria-label={label} className={cn("animate-[fade-in_.25s_ease-out_.15s_both] motion-reduce:animate-none", className)}>
      {children}
    </div>
  );
}

function Rows({ count, className }: { count: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {range(count).map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3">
          <Skeleton className="size-4 shrink-0 rounded-xs" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function PanelHead() {
  return (
    <div className="flex items-center justify-between px-1">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

function MonthGrid({ cell }: { cell: string }) {
  return (
    <div className="grid grid-cols-7 gap-1 md:gap-1.5">
      {range(35).map((i) => (
        <div key={i} className={cn("flex flex-col items-center gap-1.5 pt-2", cell)}>
          <Skeleton className="size-6 rounded-full" />
          {i % 5 === 2 && <Skeleton className="h-2.5 w-3/4" />}
        </div>
      ))}
    </div>
  );
}

// 홈: 마감 임박 + 이번 달 달력 + 할 일
export function HomeSkeleton() {
  return (
    <Loading label="홈을 불러오는 중" className="flex flex-col gap-4">
      <Card className="gap-4 px-3 md:px-6">
        <PanelHead />
        <div className="grid gap-3 xl:grid-cols-2">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="hidden h-20 rounded-2xl xl:block" />
        </div>
      </Card>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card className="gap-4 px-3 md:px-6">
          <PanelHead />
          <MonthGrid cell="h-14" />
        </Card>
        <Card className="gap-4 px-3 md:px-6">
          <PanelHead />
          <Rows count={5} />
        </Card>
      </div>
    </Loading>
  );
}

// 목록: 상태 탭 + 공고 줄
export function PostingListSkeleton() {
  return (
    <Loading label="공고를 불러오는 중">
      <Card className="gap-0 px-0 py-0 md:px-0 md:py-0">
        <div className="flex gap-4 border-b border-border px-3 pt-4 pb-3 md:px-6">
          {range(5).map((i) => (
            <Skeleton key={i} className="h-5 w-14" />
          ))}
        </div>
        {range(6).map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border-subtle px-3 py-4 last:border-b-0 md:px-6">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="hidden h-1 w-28 rounded-full md:block" />
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <Skeleton className="h-6 w-16 shrink-0 rounded-xs" />
          </div>
        ))}
      </Card>
    </Loading>
  );
}

// 달력: 월 달력 + 고른 날 일정
export function CalendarSkeleton() {
  return (
    <Loading label="달력을 불러오는 중" className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <Card className="gap-4 px-3 md:px-6">
        <PanelHead />
        <MonthGrid cell="h-16 md:h-20" />
      </Card>
      <Card className="gap-3 px-3 md:px-6">
        <Skeleton className="h-5 w-28" />
        <Rows count={3} />
      </Card>
    </Loading>
  );
}

// 할 일: 정렬 + 공고별 묶음
export function TodosSkeleton() {
  return (
    <Loading label="할 일을 불러오는 중" className="flex flex-col gap-4">
      <Skeleton className="h-9 w-56 rounded-lg" />
      {range(2).map((i) => (
        <Card key={i} className="gap-3 px-3 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-14 rounded-xs" />
          </div>
          <Rows count={3 - i} />
        </Card>
      ))}
    </Loading>
  );
}

// 공고 상세: 제목 + 전형 단계·준비 항목 + 마감·공고 정보
export function PostingDetailSkeleton() {
  return (
    <Loading label="공고를 불러오는 중" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 px-1">
        <Skeleton className="h-4 w-12" />
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-40 lg:h-8" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex gap-1.5">
            <Skeleton className="h-6 w-14 rounded-xs" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card className="gap-4 px-4 md:px-6">
          <Skeleton className="h-5 w-20" />
          <div className="flex gap-1.5">
            {range(4).map((i) => (
              <Skeleton key={i} className="h-1 flex-1 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-9 w-full rounded-lg" />
        </Card>
        <Card className="gap-4 px-4 md:px-6">
          <Skeleton className="h-5 w-20" />
          <Rows count={3} />
        </Card>
        <Card className="gap-4 px-4 md:px-6">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-7 gap-1">
            {range(7).map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        </Card>
        <Card className="gap-3 px-4 md:px-6">
          <Skeleton className="h-5 w-20" />
          {range(4).map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </Card>
      </div>
    </Loading>
  );
}
