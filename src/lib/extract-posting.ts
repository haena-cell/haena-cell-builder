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

const NEEDS_AI = ["company", "jobTitle", "deadline", "location", "employmentType", "requiredDocs", "steps"];
const needsAi = (p: ExtractedPosting) => p.unsure.some((k) => NEEDS_AI.includes(k));

// 글 붙여넣기: 키워드로 먼저 채운다. 기업명·직무는 키워드로 알 수 없어 AI 몫
function fromText(text: string): ExtractedPosting {
  const kw = readKeywordFields(text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join("\n"));
  const deadlineAt = kw.deadlineDate ? new Date(`${kw.deadlineDate}T23:59:00+09:00`).toISOString() : null;
  const posting: ExtractedPosting = {
    company: "",
    jobTitle: "",
    deadlineKind: deadlineAt ? "date" : null,
    deadlineAt,
    deadlineTimeKnown: false,
    location: kw.location,
    employmentType: kw.employmentType,
    companySize: null,
    requiredDocs: kw.requiredDocs,
    steps: kw.steps.length >= 2 ? kw.steps : ["서류 제출", "면접", "최종 결과"],
    unsure: [],
  };
  const unsure = ["company", "jobTitle", "deadline"];
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
    if (needsAi(posting)) {
      const ai = await aiExtract({ text: result.body.text });
      if (ai) posting = mergeAi(posting, ai);
    }
    // 본문이 이미지인 공고: 사이트가 이미지 가져가기를 막아(robots.txt) 링크로는 못 읽는다 → 캡처를 올리면 AI 가 읽는다
    const imageBody = result.body.text.length < 300 && result.body.imageUrls.length > 0;
    const hint = imageBody && needsAi(posting)
      ? "이 공고는 본문이 이미지라 링크로는 다 읽지 못했어요. 공고 화면을 캡처해 [캡처 올리기]로 넣으면 AI가 노란 칸을 채워요."
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
