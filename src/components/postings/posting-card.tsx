import Link from "next/link";
import { Check, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StepBar } from "@/components/postings/step-bar";
import { cn } from "@/lib/utils";
import { currentStepIndex, formatDeadline, isSubmitStep, kstDateKey, type Posting } from "@/lib/postings";

export function DeadlineBadge({ posting, daysLeft }: { posting: Posting; daysLeft: number | null }) {
  if (currentStepIndex(posting.steps) === -1) return <Badge variant="success">전형 끝</Badge>;
  if (posting.steps[0]?.completedAt) return <Badge variant="info">지원함</Badge>;
  if (posting.deadlineKind !== "date" || daysLeft === null) {
    return <Badge variant="secondary">{posting.deadlineKind === "rolling" ? "상시" : "채용 시 마감"}</Badge>;
  }
  if (daysLeft < 0) return <Badge variant="secondary">마감</Badge>;
  const label = daysLeft === 0 ? "D-DAY" : `D-${daysLeft}`;
  return (
    <Badge variant={daysLeft <= 3 ? "destructive" : "secondary"} className="tabular-nums">
      {label}
    </Badge>
  );
}

// 카드 왼쪽 마감 날짜 칸: 월 · 큰 날짜 숫자 · 요일 (날짜가 없으면 "상시"/"채용 시")
export function DateBlock({ posting }: { posting: Posting }) {
  if (posting.deadlineKind !== "date" || !posting.deadlineAt) {
    return (
      <span className="text-sm font-semibold text-muted-foreground">
        {posting.deadlineKind === "rolling" ? "상시" : "채용 시"}
      </span>
    );
  }
  const date = new Date(posting.deadlineAt);
  const part = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", ...o }).format(date);
  return (
    <>
      <span className="text-[11px] text-muted-foreground">{part({ month: "long" })}</span>
      <span className="text-[22px] leading-7 font-semibold tabular-nums">{kstDateKey(date).slice(8)}</span>
      <span className="text-xs text-muted-foreground">{part({ weekday: "short" })}</span>
    </>
  );
}

export function PostingCard({
  posting,
  daysLeft,
  highlight = false,
  onComplete,
  onBack,
}: {
  posting: Posting;
  daysLeft: number | null;
  highlight?: boolean;
  onComplete: (posting: Posting, stepIndex: number) => void;
  onBack: (posting: Posting) => void;
}) {
  const current = currentStepIndex(posting.steps);
  const step = current === -1 ? null : posting.steps[current];

  return (
    <Card
      className={cn(
        "relative flex-row gap-0 rounded-[20px] border border-border py-0 transition-colors hover:border-foreground/20 md:rounded-[20px]",
        highlight && "ring-2 ring-primary",
      )}
    >
      <div className="flex w-16 shrink-0 flex-col items-center justify-center border-r border-border py-4 md:w-[72px]">
        <DateBlock posting={posting} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        {/* 휴대폰은 배지를 기업명 위 한 줄로, 넓은 화면은 오른쪽에 */}
        <div className="flex flex-col-reverse gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            {/* 카드 전체를 누르면 상세로 (버튼은 위에 따로 눌림) */}
            <Link
              href={`/app/postings/${posting.id}`}
              className="block truncate text-base font-semibold after:absolute after:inset-0 after:rounded-[20px]"
            >
              {posting.company}
            </Link>
            <p className="truncate text-sm text-muted-foreground">{posting.jobTitle}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end">
            {posting.isSample && <Badge variant="warning">연습용 예시</Badge>}
            <DeadlineBadge posting={posting} daysLeft={daysLeft} />
          </div>
        </div>

        <StepBar steps={posting.steps} current={current} />

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 text-xs text-muted-foreground">
            <p className="truncate">
              지금: <span className="font-semibold text-foreground">{step ? step.name : "전형 끝"}</span>
            </p>
            <p className="truncate tabular-nums">{formatDeadline(posting)}</p>
          </div>
          {step ? (
            <Button variant="outline" size="lg" className="relative z-10" onClick={() => onComplete(posting, current)}>
              <Check data-icon="inline-start" />
              {isSubmitStep(step.name) ? "제출 완료" : "다음 단계로"}
            </Button>
          ) : (
            // 전형이 끝난 공고: 마지막 단계로 되돌리기
            <Button variant="ghost" size="lg" className="relative z-10" onClick={() => onBack(posting)}>
              <Undo2 data-icon="inline-start" />
              이전 단계로
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
