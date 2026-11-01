// 공고 화면에서 쓰는 모양과 계산. 마감 날짜는 모두 한국 시간 기준으로 센다.

export type DeadlineKind = "date" | "rolling" | "until_filled";

export type PostingStep = {
  id: string;
  name: string;
  completedAt: string | null;
};

export type Subtask = {
  id: string;
  label: string;
  done: boolean;
  dueDate: string | null; // 한국 날짜 YYYY-MM-DD
};

export type PrepItem = {
  id: string;
  label: string;
  done: boolean;
  dueDate: string | null; // 한국 날짜 YYYY-MM-DD
  subtasks: Subtask[];
};

export type Posting = {
  id: string;
  company: string;
  jobTitle: string;
  deadlineKind: DeadlineKind;
  deadlineAt: string | null;
  deadlineTimeKnown: boolean;
  location: string | null;
  employmentType: string | null;
  companySize: string | null;
  requiredDocs: string[];
  sourceUrl: string | null;
  steps: PostingStep[];
  prepItems: PrepItem[];
  isSample: boolean;
  priority: Priority;
};

// 우선순위와 근로형태 드롭다운 선택지 (D-26). 근로형태는 이 밖의 글자도 그대로 보여 준다
export type Priority = "high" | "medium" | "low";
export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "high", label: "높음" },
  { value: "medium", label: "보통" },
  { value: "low", label: "낮음" },
];
export const EMPLOYMENT_TYPES = ["정규직", "계약직", "인턴", "파견", "프리랜서", "아르바이트"];

// 준비 항목 기본 목록 + 공고의 제출 서류 중 다른 항목 (DB.md 4번)
export function defaultPrepLabels(requiredDocs: string[]) {
  return [...new Set(["이력서", "포트폴리오", "과제", ...requiredDocs])];
}

const KST = "Asia/Seoul";
const DAY_MS = 24 * 60 * 60 * 1000;

// 한국 시간 기준 날짜 문자열 (YYYY-MM-DD)
export function kstDateKey(date: Date) {
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

export function daysLeftFor(posting: Posting, now: Date) {
  return posting.deadlineKind === "date" && posting.deadlineAt ? daysUntil(posting.deadlineAt, now) : null;
}

// 아직 끝나지 않은 첫 단계. 모두 끝났으면 -1.
export function currentStepIndex(steps: PostingStep[]) {
  return steps.findIndex((step) => step.completedAt === null);
}

// 서류·과제처럼 무언가를 내는 단계인지
export function isSubmitStep(name: string) {
  return /제출|과제|서류$/.test(name) && !name.includes("결과");
}

// 현재 단계를 current 로 바꾼 단계 목록 (앞은 끝낸 것, 뒤는 안 끝낸 것). setCurrentStep 과 같은 규칙.
export function withCurrentStep(steps: PostingStep[], current: number, now = new Date().toISOString()) {
  return steps.map((s, i) => ({ ...s, completedAt: i < current ? (s.completedAt ?? now) : null }));
}

// 할 일 마감 날짜(YYYY-MM-DD)까지 남은 날 수 (today 도 한국 날짜)
export function daysToDate(dueDate: string, today: string) {
  return Math.round((Date.parse(dueDate) - Date.parse(today)) / DAY_MS);
}

// "11월 5일 (목) · D-3"
export function formatDueDate(dueDate: string, today: string) {
  const day = new Intl.DateTimeFormat("ko-KR", { timeZone: "UTC", month: "long", day: "numeric", weekday: "short" }).format(
    new Date(`${dueDate}T00:00:00Z`),
  );
  const days = daysToDate(dueDate, today);
  const left = days === 0 ? "오늘" : days > 0 ? `D-${days}` : `${-days}일 지남`;
  return `${day} · ${left}`;
}
