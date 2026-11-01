import { Badge } from "@/components/ui/badge";
import { currentStepIndex, kstDateKey, type Posting } from "@/lib/postings";

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
