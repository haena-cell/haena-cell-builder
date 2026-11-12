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
  sourceText: string | null; // 글 붙여넣기 원문 (D-30)
  steps: PostingStep[];
  prepItems: PrepItem[];
  isSample: boolean;
  memo?: string | null; // 직무 설명·메모 (2026-11-13)
  period?: string | null; // 시기 "2026 상" — 비어 있으면 마감일로 계산 (D-74)
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

// 전형 단계를 고친 뒤의 진행 상태 (D-48). 지금 단계는 유지하고, 그 앞은 끝남·뒤는 남음으로 맞춘다.
// 지금 단계를 지웠으면 그다음 남은 단계, 그것도 없으면 새로 넣은 첫 단계가 지금 단계가 된다
export function arrangeSteps(old: PostingStep[], items: { id: string; name: string }[], now = new Date().toISOString()): PostingStep[] {
  const kept = new Set(items.map((i) => i.id));
  const oldById = new Map(old.map((s) => [s.id, s]));
  const oldCurrent = currentStepIndex(old);
  const anchor = oldCurrent >= 0 ? old.slice(oldCurrent).find((s) => kept.has(s.id)) : undefined;
  const position = anchor ? items.findIndex((i) => i.id === anchor.id) : items.findIndex((i) => !oldById.has(i.id));
  const current = position < 0 ? items.length : position;
  return items.map((item, i) => ({
    id: item.id,
    name: item.name,
    completedAt: i < current ? (oldById.get(item.id)?.completedAt ?? now) : null,
  }));
}

// 할 일 마감 날짜(YYYY-MM-DD)까지 남은 날 수 (today 도 한국 날짜)
export function daysToDate(dueDate: string, today: string) {
  return Math.round((Date.parse(dueDate) - Date.parse(today)) / DAY_MS);
}

// "11월 5일 (목) · D-3"
// 할 일 마감 표시: "D-5 | 11/26 (화)", 오늘 "D-day", 지나면 "D+2" (2026-11-12 사용자 요청)
export function formatDueDate(dueDate: string, today: string) {
  const d = new Date(`${dueDate}T00:00:00Z`);
  const weekday = new Intl.DateTimeFormat("ko-KR", { timeZone: "UTC", weekday: "short" }).format(d);
  const days = daysToDate(dueDate, today);
  const left = days === 0 ? "D-day" : days > 0 ? `D-${days}` : `D+${-days}`;
  return `${left} | ${d.getUTCMonth() + 1}/${d.getUTCDate()} (${weekday})`;
}

// 다른 공고들의 마감 날짜(한국 날짜): 공고 상세의 마감 주 달력에 함께 보여 준다 (2026-11-12)
export function otherDeadlines(postings: Posting[], exceptId: string) {
  return postings
    .filter((p) => p.id !== exceptId && p.deadlineKind === "date" && p.deadlineAt)
    .map((p) => ({ id: p.id, company: p.company, date: kstDateKey(new Date(p.deadlineAt as string)) }));
}

// ── 같은 회사 재지원 (D-72) ─────────────────────────────

// 같은 회사인지 비교할 열쇠: (주)·주식회사·괄호 안 글자·띄어쓰기·대소문자를 뺀다
export function companyKey(name: string) {
  return name
    .replace(/\(주\)|㈜|주식회사/g, "")
    .replace(/\([^)]*\)|\[[^\]]*\]/g, "")
    .replace(/[\s.·_-]/g, "")
    .toLowerCase();
}

// 시기: 직접 정한 시기, 없으면 마감일(한국 날짜) 1~6월 "상", 7~12월 "하". 둘 다 없으면 null
export function periodOf(p: Pick<Posting, "deadlineKind" | "deadlineAt" | "period">) {
  if (p.period && /^\d{4} (상|하)$/.test(p.period)) return p.period; // 직접 정한 시기가 먼저 (D-74)
  if (p.deadlineKind !== "date" || !p.deadlineAt) return null;
  const key = kstDateKey(new Date(p.deadlineAt));
  return `${key.slice(0, 4)} ${Number(key.slice(5, 7)) <= 6 ? "상" : "하"}`;
}

export type ResultTone = "before" | "active" | "done" | "fail" | "pass";

// 결과: 메모 첫머리의 "결과: …"(노션에서 옮긴 공고)가 있으면 그것, 없으면 진행 단계로
export function resultOf(p: Pick<Posting, "steps" | "memo">): { label: string; tone: ResultTone } {
  const written = /(?:^|\n)결과: ?([^\n]{1,20})/.exec(p.memo ?? "")?.[1]?.trim();
  if (written) return { label: written, tone: /합격/.test(written) && !/불합격/.test(written) ? "pass" : "fail" };
  const current = currentStepIndex(p.steps);
  if (current === -1) return { label: "전형 끝", tone: "done" };
  if (current === 0) return { label: "지원 전", tone: "before" };
  return { label: `${p.steps[current].name} 차례`, tone: "active" };
}

const deadlineTime = (p: Posting) => (p.deadlineKind === "date" && p.deadlineAt ? Date.parse(p.deadlineAt) : null);

// 이 공고보다 마감이 이른, 같은 회사의 가장 최근 공고 (목록 '재지원' 배지용). 마감이 같으면(같은 시기 동시 지원) 빼고
export function previousApplication(p: Posting, all: Posting[]) {
  const key = companyKey(p.company);
  const mine = deadlineTime(p);
  if (!key || mine === null) return null;
  const earlier = all
    .filter((o) => o.id !== p.id && companyKey(o.company) === key)
    .filter((o) => {
      const t = deadlineTime(o);
      return t !== null && kstDateKey(new Date(t)) < kstDateKey(new Date(mine));
    })
    .sort((a, b) => (deadlineTime(b) ?? 0) - (deadlineTime(a) ?? 0));
  return earlier[0] ?? null;
}

// 같은 회사 공고 모두(자기 포함), 마감 늦은 순. 2개 이상일 때만 상세에 보여 준다
export function sameCompanyPostings(p: Posting, all: Posting[]) {
  const key = companyKey(p.company);
  if (!key) return [];
  return all
    .filter((o) => o.id === p.id || companyKey(o.company) === key)
    .sort((a, b) => (deadlineTime(b) ?? Infinity) - (deadlineTime(a) ?? Infinity));
}

export type CompanyHistoryItem = { id: string; jobTitle: string; period: string | null; result: { label: string; tone: ResultTone }; memo: string | null; isCurrent: boolean };

// 공고 상세 '이 회사 지원 기록'에 넘길 작은 목록. 같은 회사 공고가 하나뿐이면 빈 배열
export function companyHistory(p: Posting, all: Posting[]): CompanyHistoryItem[] {
  const list = sameCompanyPostings(p, all);
  if (list.length < 2) return [];
  return list.map((o) => ({ id: o.id, jobTitle: o.jobTitle, period: periodOf(o), result: resultOf(o), memo: o.memo ?? null, isCurrent: o.id === p.id }));
}
