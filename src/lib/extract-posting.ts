import type { DeadlineKind } from "@/lib/postings";
import { aiExtract, mergeAi } from "@/lib/ai-extract";
import { readKeywordFields } from "@/lib/posting-keywords";
import { readPostingLink } from "@/lib/read-posting-link";

// 공고 원본(링크·글·캡처)을 정해진 항목으로 정리하는 기능.
// 1) 링크: 페이지 안의 정리된 채용 정보·본문 키워드 (T-15, read-posting-link.ts) / 글: 키워드 (posting-keywords.ts)
// 2) 빈 칸이 남거나 본문·캡처가 이미지면 AI 가 채운다 (D-29, ai-extract.ts). AI 가 실패하면 1) 결과 그대로

export type ExtractInput =
  | { kind: "link"; url: string }
  | { kind: "text"; text: string }
  | { kind: "image"; dataUrl: string };

export type ExtractedPosting = {
  company: string;
  jobTitle: string;
  jobOptions?: string[]; // 여러 직무 공고의 후보. 확인 화면에서 고르는 데만 쓰고 저장하지 않는다 (D-43)
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
  | { status: "ok"; posting: ExtractedPosting; isExample: boolean; hint?: string }
  | { status: "need_fallback"; message: string };

// 로그인해야 볼 수 있어 서버에서 읽을 수 없는 사이트
const LOGIN_REQUIRED_HOSTS = ["instagram.com", "threads.net", "facebook.com", "linkedin.com"];

function needsLogin(url: string) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  return LOGIN_REQUIRED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

// 링크로는 기본 정보만 읽고 페이지 글을 AI 에 보내지 않는 사이트 (D-40). 글을 붙여넣거나 캡처를 올리면 AI 가 읽는다
const NO_AI_LINK_HOSTS = ["saramin.co.kr", "jobkorea.co.kr"];

function linkAiAllowed(url: string) {
  const host = new URL(url).hostname;
  return !NO_AI_LINK_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

const NEEDS_AI = ["company", "jobTitle", "deadline", "location", "employmentType", "requiredDocs", "steps"];
const needsAi = (p: ExtractedPosting) => p.unsure.some((k) => NEEDS_AI.includes(k));

// 글 붙여넣기: 키워드로 먼저 채운다. 항목 이름 없이 짐작한 기업명·직무와 마감일은 확인 칸으로 남긴다
function fromText(text: string): ExtractedPosting {
  const kw = readKeywordFields(text);
  const deadlineAt = kw.deadlineDate ? new Date(`${kw.deadlineDate}T${kw.deadlineTime ?? "23:59"}:00+09:00`).toISOString() : null;
  const posting: ExtractedPosting = {
    company: kw.company ?? "",
    jobTitle: kw.jobTitle ?? "",
    jobOptions: kw.jobOptions,
    deadlineKind: kw.deadlineKind,
    deadlineAt,
    deadlineTimeKnown: kw.deadlineTime !== null,
    location: kw.location,
    employmentType: kw.employmentType,
    companySize: null,
    requiredDocs: kw.requiredDocs,
    steps: kw.steps.length >= 2 ? kw.steps : ["서류 제출", "면접", "최종 결과"],
    unsure: [],
  };
  const unsure = ["deadline", ...kw.guessed] as string[];
  if (!posting.company && !unsure.includes("company")) unsure.push("company");
  if (!posting.jobTitle && !unsure.includes("jobTitle")) unsure.push("jobTitle");
  if (!posting.location) unsure.push("location");
  if (!posting.employmentType) unsure.push("employmentType");
  if (posting.requiredDocs.length === 0) unsure.push("requiredDocs");
  if (kw.steps.length < 2) unsure.push("steps");
  return { ...posting, unsure };
}

const EMPTY: ExtractedPosting = {
  company: "",
  jobTitle: "",
  deadlineKind: null,
  deadlineAt: null,
  deadlineTimeKnown: false,
  location: null,
  employmentType: null,
  companySize: null,
  requiredDocs: [],
  steps: ["서류 제출", "면접", "최종 결과"],
  unsure: ["company", "jobTitle", "deadline", "location", "employmentType", "requiredDocs", "steps"],
};

export async function extractPosting(input: ExtractInput): Promise<ExtractResult> {
  if (input.kind === "link") {
    if (needsLogin(input.url)) {
      return { status: "need_fallback", message: "이 사이트는 로그인해야 볼 수 있어서 바로 읽을 수 없어요." };
    }
    const result = await readPostingLink(input.url);
    if (result.status === "unreadable") return { status: "need_fallback", message: result.message };
    let posting = result.posting;
    if (needsAi(posting) && linkAiAllowed(input.url)) {
      const ai = await aiExtract({ text: result.body.text });
      if (ai) posting = mergeAi(posting, ai);
    }
    // 링크로 못 읽은 서류·전형은 사용자가 글·캡처로 넣으면 채워진다
    const missingBody = posting.unsure.includes("steps") || posting.unsure.includes("requiredDocs");
    const hint = missingBody
      ? "링크로는 기본 정보만 읽었어요. 서류·전형은 공고 글을 붙여넣거나 화면을 캡처해 올리면 노란 칸을 채울 수 있어요."
      : undefined;
    return { status: "ok", posting, isExample: false, hint };
  }

  if (input.kind === "text") {
    let posting = fromText(input.text);
    const ai = await aiExtract({ text: input.text });
    if (ai) posting = mergeAi(posting, ai);
    return { status: "ok", posting, isExample: false };
  }

  // 캡처: 글자를 AI 가 읽는다. 키가 없거나 실패하면 빈 칸으로 직접 입력
  const ai = await aiExtract({ imageDataUrl: input.dataUrl });
  if (!ai) return { status: "need_fallback", message: "캡처를 읽지 못했어요. 공고 글을 붙여넣어 주세요." };
  return { status: "ok", posting: mergeAi(EMPTY, ai), isExample: false };
}
