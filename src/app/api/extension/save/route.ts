import { createPosting } from "@/lib/posting-actions";
import type { DeadlineKind } from "@/lib/postings";

// 크롬 확장 팝업에서 공고 저장 (D-47). 로그인 안 하면 proxy.ts 가 401 로 막고, 데이터는 RLS 로 본인 것만 저장된다
const MAX_RAW = 50_000;
const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 20) : []);
const text = (v: unknown) => (typeof v === "string" ? v : null);

// 다른 사이트에서 몰래 보낸 요청을 막는다: 확장 프로그램과 앱 화면에서 온 요청만
function allowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !!origin && (origin.startsWith("chrome-extension://") || origin === new URL(request.url).origin);
}

export async function POST(request: Request) {
  if (!allowedOrigin(request)) return Response.json({ ok: false, message: "잘못된 요청이에요." }, { status: 403 });
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, message: "잘못된 요청이에요." }, { status: 400 });
  }
  const rawSize = JSON.stringify(body.aiRaw ?? null).length;
  const result = await createPosting({
    company: text(body.company) ?? "",
    jobTitle: text(body.jobTitle) ?? "",
    deadlineKind: body.deadlineKind as DeadlineKind, // 값은 createPosting 이 확인한다
    deadlineAt: text(body.deadlineAt),
    deadlineTimeKnown: body.deadlineTimeKnown === true,
    location: text(body.location),
    employmentType: text(body.employmentType),
    companySize: text(body.companySize),
    requiredDocs: strings(body.requiredDocs),
    steps: strings(body.steps),
    sourceKind: "link",
    sourceUrl: text(body.sourceUrl),
    sourceText: null,
    aiRaw: rawSize <= MAX_RAW ? ((body.aiRaw ?? null) as Parameters<typeof createPosting>[0]["aiRaw"]) : null,
  });
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
