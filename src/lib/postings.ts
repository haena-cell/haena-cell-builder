// 공고 화면에서 쓰는 모양과 계산. 마감 날짜는 모두 한국 시간 기준으로 센다.

export type DeadlineKind = "date" | "rolling" | "until_filled";

export type PostingStep = {
  name: string;
  completedAt: string | null;
};

export type Posting = {
  id: string;
  company: string;
  jobTitle: string;
  deadlineKind: DeadlineKind;
  deadlineAt: string | null;
  deadlineTimeKnown: boolean;
  steps: PostingStep[];
  isSample: boolean;
};

const KST = "Asia/Seoul";
const DAY_MS = 24 * 60 * 60 * 1000;

// 한국 시간 기준 날짜 문자열 (YYYY-MM-DD)
function kstDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: KST }).format(date);
}

// 오늘(한국 시간)부터 마감일까지 남은 날 수. 오늘 마감이면 0, 지났으면 음수.
export function daysUntil(deadlineAt: string, now: Date) {
  const today = Date.parse(kstDateKey(now));
  const deadline = Date.parse(kstDateKey(new Date(deadlineAt)));
  return Math.round((deadline - today) / DAY_MS);
}

export function formatDeadline(posting: Pick<Posting, "deadlineKind" | "deadlineAt" | "deadlineTimeKnown">) {
  if (posting.deadlineKind === "rolling") return "상시 모집";
  if (posting.deadlineKind === "until_filled") return "채용 시 마감";
  if (!posting.deadlineAt) return "마감일 없음";
  const date = new Date(posting.deadlineAt);
  const day = new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST,
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
  if (!posting.deadlineTimeKnown) return `${day} 마감`;
  const time = new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return `${day} ${time} 마감`;
}

// 아직 끝나지 않은 첫 단계. 모두 끝났으면 -1.
export function currentStepIndex(steps: PostingStep[]) {
  return steps.findIndex((step) => step.completedAt === null);
}

// 서류·과제처럼 무언가를 내는 단계인지
export function isSubmitStep(name: string) {
  return /제출|과제|서류$/.test(name) && !name.includes("결과");
}
