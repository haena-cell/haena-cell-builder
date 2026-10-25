import type { Posting } from "@/lib/postings";

// 연습용 예시 공고 3개.
// DB 기능 create_sample_postings (supabase/migrations/…_create_postings.sql) 와 같은 내용이다.
// 5단계에서 로그인·DB를 연결하면 이 파일 대신 DB에서 읽는다 (TASKS T-16).

// 오늘(한국 시간)에서 days 일 뒤 hh:mm (한국 시간)
function kstAt(now: Date, days: number, time: string) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now);
  const base = new Date(`${today}T${time}:00+09:00`);
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function makeSamplePostings(now: Date): Posting[] {
  return [
    {
      id: "sample-1",
      company: "예시상사",
      jobTitle: "프로덕트 디자이너",
      deadlineKind: "date",
      deadlineAt: kstAt(now, 2, "23:59"),
      deadlineTimeKnown: true,
      steps: [
        { name: "서류 제출", completedAt: null },
        { name: "과제", completedAt: null },
        { name: "면접", completedAt: null },
        { name: "최종 결과", completedAt: null },
      ],
      isSample: true,
    },
    {
      id: "sample-2",
      company: "샘플랩",
      jobTitle: "UX 리서처 인턴",
      deadlineKind: "date",
      deadlineAt: kstAt(now, 10, "18:00"),
      deadlineTimeKnown: true,
      steps: [
        { name: "서류 제출", completedAt: now.toISOString() },
        { name: "서류 결과", completedAt: null },
        { name: "면접", completedAt: null },
        { name: "최종 결과", completedAt: null },
      ],
      isSample: true,
    },
    {
      id: "sample-3",
      company: "연습스튜디오",
      jobTitle: "브랜드 디자이너",
      deadlineKind: "rolling",
      deadlineAt: null,
      deadlineTimeKnown: false,
      steps: [
        { name: "서류 제출", completedAt: null },
        { name: "면접", completedAt: null },
        { name: "최종 결과", completedAt: null },
      ],
      isSample: true,
    },
  ];
}
