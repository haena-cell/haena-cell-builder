import { kstDateKey, type Posting, type PrepItem } from "@/lib/postings";

// 둘러보기 예시 공고 (D-34). 모두 가상의 회사와 공고다. 마감일은 오늘 기준으로 계산해 낡지 않게 한다.

const DAY_MS = 24 * 60 * 60 * 1000;

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${++seq}`;

function steps(names: string[], doneCount: number, now: Date): Posting["steps"] {
  return names.map((name, i) => ({
    id: nextId("step"),
    name,
    completedAt: i < doneCount ? new Date(now.getTime() - (doneCount - i) * 3 * DAY_MS).toISOString() : null,
  }));
}

type TodoSeed = { label: string; done?: boolean; dueIn?: number; subtasks?: { label: string; done?: boolean; dueIn?: number }[] };

function prepItems(seeds: TodoSeed[], now: Date): PrepItem[] {
  const due = (days?: number) => (days === undefined ? null : kstDateKey(new Date(now.getTime() + days * DAY_MS)));
  return seeds.map((item) => ({
    id: nextId("prep"),
    label: item.label,
    done: item.done ?? false,
    dueDate: due(item.dueIn),
    subtasks: (item.subtasks ?? []).map((t) => ({ id: nextId("sub"), label: t.label, done: t.done ?? false, dueDate: due(t.dueIn) })),
  }));
}

export function demoPostings(now: Date): Posting[] {
  seq = 0;
  const deadline = (days: number, time?: string) =>
    new Date(`${kstDateKey(new Date(now.getTime() + days * DAY_MS))}T${time ?? "23:59"}:00+09:00`).toISOString();
  const base = { deadlineTimeKnown: false, sourceUrl: null, sourceText: null, isSample: false } as const;

  return [
    {
      ...base,
      id: "demo-noeul",
      company: "노을커머스",
      jobTitle: "퍼포먼스 마케터 (신입)",
      deadlineKind: "date",
      deadlineAt: deadline(1, "18:00"),
      deadlineTimeKnown: true,
      location: "서울 성동구 (2호선 성수역)",
      employmentType: "정규직",
      companySize: "스타트업",
      requiredDocs: ["이력서", "포트폴리오"],
      priority: "high",
      steps: steps(["서류 제출", "과제 전형", "1차 면접", "최종 합격"], 0, now),
      prepItems: prepItems(
        [
          { label: "이력서", dueIn: 0, subtasks: [{ label: "광고 집행 성과 수치로 고치기", done: true }, { label: "자기소개 문단 다듬기", dueIn: 0 }] },
          { label: "포트폴리오", dueIn: 1, subtasks: [{ label: "캠페인 사례 2개 정리", dueIn: 1 }] },
        ],
        now,
      ),
    },
    {
      ...base,
      id: "demo-dalkom",
      company: "달콤랩스",
      jobTitle: "서비스 기획자 (주니어)",
      deadlineKind: "date",
      deadlineAt: deadline(3),
      location: "서울 강남구 (2호선 역삼역)",
      employmentType: "정규직",
      companySize: "중소기업",
      requiredDocs: ["이력서", "자기소개서", "포트폴리오"],
      priority: "high",
      steps: steps(["서류 제출", "실무 면접", "임원 면접", "최종 합격"], 0, now),
      prepItems: prepItems([{ label: "자기소개서", dueIn: 2 }, { label: "포트폴리오", dueIn: 3 }, { label: "이력서", done: true }], now),
      sourceText:
        "[달콤랩스] 서비스 기획자 (주니어) 채용\n\n주요 업무\n- 앱 서비스 화면 기획, 정책 정리\n- 사용자 데이터 분석과 개선안 도출\n\n근무지: 서울 강남구\n고용형태: 정규직\n제출서류: 이력서, 자기소개서, 포트폴리오\n전형절차: 서류 제출 > 실무 면접 > 임원 면접 > 최종 합격",
    },
    {
      ...base,
      id: "demo-leaf",
      company: "리프트래블",
      jobTitle: "브랜드 마케터",
      deadlineKind: "date",
      deadlineAt: deadline(9),
      location: "서울 마포구 (2호선 합정역)",
      employmentType: "정규직",
      companySize: "스타트업",
      requiredDocs: ["이력서", "포트폴리오"],
      priority: "medium",
      steps: steps(["서류 제출", "과제 전형", "면접", "최종 합격"], 0, now),
      prepItems: prepItems([{ label: "이력서", dueIn: 6 }, { label: "포트폴리오" }], now),
    },
    {
      ...base,
      id: "demo-maru",
      company: "마루핀테크",
      jobTitle: "프로덕트 매니저 (PM) 인턴",
      deadlineKind: "date",
      deadlineAt: deadline(16),
      location: "서울 영등포구 (5호선 여의나루역)",
      employmentType: "인턴",
      companySize: "중견기업",
      requiredDocs: ["이력서", "자기소개서"],
      priority: "medium",
      steps: steps(["서류 제출", "인적성 검사", "1차 면접", "최종 합격"], 0, now),
      prepItems: prepItems([{ label: "이력서" }, { label: "자기소개서", dueIn: 12 }], now),
    },
    {
      ...base,
      id: "demo-bomnal",
      company: "봄날푸드",
      jobTitle: "마케팅 기획 담당자",
      deadlineKind: "rolling",
      deadlineAt: null,
      location: "경기 성남시 분당구",
      employmentType: "계약직",
      companySize: "중견기업",
      requiredDocs: ["이력서"],
      priority: "low",
      steps: steps(["서류 제출", "면접", "최종 합격"], 0, now),
      prepItems: prepItems([{ label: "이력서" }], now),
    },
    {
      ...base,
      id: "demo-stepfit",
      company: "스텝핏",
      jobTitle: "콘텐츠 마케터",
      deadlineKind: "date",
      deadlineAt: deadline(5),
      location: "서울 서초구 (3호선 양재역)",
      employmentType: "정규직",
      companySize: "스타트업",
      requiredDocs: ["이력서", "포트폴리오"],
      priority: "high",
      steps: steps(["서류 제출", "과제 전형", "면접", "최종 합격"], 1, now),
      prepItems: prepItems(
        [
          { label: "이력서", done: true },
          { label: "포트폴리오", done: true },
          { label: "과제", dueIn: 2, subtasks: [{ label: "인스타그램 콘텐츠 3건 기획", done: true }, { label: "기획 의도 한 장 정리", dueIn: 2 }] },
        ],
        now,
      ),
    },
    {
      ...base,
      id: "demo-haneul",
      company: "하늘모빌리티",
      jobTitle: "사업 기획 (신입)",
      deadlineKind: "date",
      deadlineAt: deadline(-6),
      location: "경기 성남시 판교",
      employmentType: "정규직",
      companySize: "대기업",
      requiredDocs: ["이력서", "자기소개서"],
      priority: "medium",
      steps: steps(["서류 제출", "서류 결과", "1차 면접", "2차 면접", "최종 합격"], 2, now),
      prepItems: prepItems(
        [{ label: "면접 준비", dueIn: 4, subtasks: [{ label: "회사 사업 구조 정리", done: true }, { label: "예상 질문 답변 쓰기", dueIn: 3 }] }],
        now,
      ),
    },
    {
      ...base,
      id: "demo-bridge",
      company: "브릿지룸",
      jobTitle: "그로스 마케터",
      deadlineKind: "date",
      deadlineAt: deadline(-21),
      location: "서울 중구",
      employmentType: "정규직",
      companySize: "스타트업",
      requiredDocs: ["이력서"],
      priority: "low",
      steps: steps(["서류 제출", "면접", "최종 결과"], 3, now),
      prepItems: prepItems([{ label: "이력서", done: true }], now),
    },
  ];
}
