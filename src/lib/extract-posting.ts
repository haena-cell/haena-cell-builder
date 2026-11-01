import type { DeadlineKind } from "@/lib/postings";
import { readPostingLink } from "@/lib/read-posting-link";

// 공고 원본(링크·글·캡처)을 정해진 항목으로 정리하는 기능. AI 는 쓰지 않는다 (D-23).
// 링크: 페이지 안의 정리된 채용 정보를 읽는다 (T-15, read-posting-link.ts)
// ▶ 아직 연습용 예시: 글 붙여넣기(T-06 키워드 정리)·캡처(T-04b) — 이 파일의 extractPosting 에서 바꾼다

export type ExtractInput =
  | { kind: "link"; url: string }
  | { kind: "text"; text: string }
  | { kind: "image"; dataUrl: string };

export type ExtractedPosting = {
  company: string;
  jobTitle: string;
  deadlineKind: DeadlineKind | null; // 모르면 비워 두고 사용자가 고른다
  deadlineAt: string | null;
  deadlineTimeKnown: boolean;
  location: string | null;
  employmentType: string | null;
  companySize: string | null;
  requiredDocs: string[];
  steps: string[];
  unsure: string[]; // 자신 없는 칸 이름
};

export type ExtractResult =
  | { status: "ok"; posting: ExtractedPosting; isExample: boolean }
  | { status: "need_fallback"; message: string };

// 로그인해야 볼 수 있어 서버에서 읽을 수 없는 사이트
const LOGIN_REQUIRED_HOSTS = ["instagram.com", "threads.net", "facebook.com", "linkedin.com"];

function needsLogin(url: string) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  return LOGIN_REQUIRED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

const EXAMPLE_POSTING: ExtractedPosting = {
  company: "예시디자인",
  jobTitle: "UI 디자이너 (신입)",
  deadlineKind: null,
  deadlineAt: null,
  deadlineTimeKnown: false,
  location: "서울 성수",
  employmentType: "정규직",
  companySize: "스타트업",
  requiredDocs: ["이력서", "포트폴리오"],
  steps: ["서류 제출", "과제", "면접", "최종 결과"],
  unsure: ["deadline"],
};

export async function extractPosting(input: ExtractInput): Promise<ExtractResult> {
  if (input.kind === "link") {
    if (needsLogin(input.url)) {
      return { status: "need_fallback", message: "이 사이트는 로그인해야 볼 수 있어서 바로 읽을 수 없어요." };
    }
    const result = await readPostingLink(input.url);
    if (result.status === "unreadable") return { status: "need_fallback", message: result.message };
    return { status: "ok", posting: result.posting, isExample: false };
  }

  // 연습용: 읽는 중 화면을 볼 수 있게 잠깐 기다린다
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return { status: "ok", posting: EXAMPLE_POSTING, isExample: true };
}
