import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StepBar } from "@/components/postings/step-bar";
import { cn } from "@/lib/utils";
import { currentStepIndex, formatDeadline, isSubmitStep, type Posting } from "@/lib/postings";

export function DeadlineBadge({ posting, daysLeft }: { posting: Posting; daysLeft: number | null }) {
  if (posting.steps[0]?.completedAt) return <Badge variant="secondary">지원함</Badge>;
  if (posting.deadlineKind !== "date" || daysLeft === null) {
    return <Badge variant="outline">{posting.deadlineKind === "rolling" ? "상시" : "채용 시 마감"}</Badge>;
  }
  if (daysLeft < 0) return <Badge variant="secondary">마감</Badge>;
  const label = daysLeft === 0 ? "D-DAY" : `D-${daysLeft}`;
  return (
    <Badge variant={daysLeft <= 3 ? "destructive" : "secondary"} className="tabular-nums">
      {label}
    </Badge>
  );
}

export function PostingCard({
  posting,
  daysLeft,
  highlight = false,
  onComplete,
}: {
  posting: Posting;
  daysLeft: number | null;
  highlight?: boolean;
  onComplete: (posting: Posting, stepIndex: number) => void;
}) {
  const current = currentStepIndex(posting.steps);
  const step = current === -1 ? null : posting.steps[current];

  return (
    <Card className={cn("relative gap-4 border border-border px-4 shadow-none ring-0 transition-shadow hover:border-foreground/30", highlight && "ring-2 ring-primary")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* 카드 전체를 누르면 상세로 (버튼은 위에 따로 눌림) */}
          <Link
            href={`/app/postings/${posting.id}`}
            className="block truncate text-base font-semibold after:absolute after:inset-0 after:rounded-xl"
          >
            {posting.company}
          </Link>
          <p className="truncate text-sm text-muted-foreground">{posting.jobTitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {posting.isSample && (
            <Badge className="bg-warning text-warning-foreground">연습용 예시</Badge>
          )}
          <DeadlineBadge posting={posting} daysLeft={daysLeft} />
        </div>
      </div>

      <StepBar steps={posting.steps} current={current} />

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <div className="min-w-0 text-xs text-muted-foreground">
          <p className="truncate">
            지금: <span className="font-semibold text-foreground">{step ? step.name : "전형 끝"}</span>
          </p>
          <p className="truncate tabular-nums">{formatDeadline(posting)}</p>
        </div>
        {step && (
          <Button variant="outline" size="lg" className="relative z-10 px-3" onClick={() => onComplete(posting, current)}>
            <Check data-icon="inline-start" />
            {isSubmitStep(step.name) ? "제출 완료" : "다음 단계로"}
          </Button>
        )}
      </div>
    </Card>
  );
}
