import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { ExtractedPosting } from "@/lib/extract-posting";
import { htmlToLines, readKeywordFields } from "@/lib/posting-keywords";

// 링크로 공고 읽기 (T-15, D-23·D-24). AI 없이 페이지 안의 정리된 채용 정보(JobPosting)·설명 한 줄을 읽는다.
// 원칙(D-24): 사용자가 [정리하기]를 누를 때 그 페이지 하나만 한 번 가져오고, 공고 전문은 저장하지 않는다.

const TIMEOUT_MS = 8000;
const MAX_BYTES = 3_000_000;
const MAX_REDIRECTS = 3;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const DEFAULT_STEPS: string[] = ["서류 제출", "면접", "최종 결과"];

export type LinkReadResult =
  | { status: "ok"; posting: ExtractedPosting }
  | { status: "unreadable"; message: string };

const UNREADABLE = "이 링크는 바로 읽지 못했어요.";

// 서버 안쪽 주소(내 컴퓨터·사내망)로는 요청하지 않는다
function isPrivateAddress(ip: string) {
  if (isIP(ip) === 6) {
    const v6 = ip.toLowerCase();
    if (v6.startsWith("::ffff:")) return isPrivateAddress(v6.slice(7));
    return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
  );
}

async function assertPublicUrl(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocol");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address);
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) throw new Error("private");
}

// 페이지 한 개 가져오기: 넘겨주기(redirect)도 매번 주소를 확인하고, 크기·시간을 제한한다
async function fetchPage(start: string) {
  let url = new URL(start);
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await assertPublicUrl(url);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml", "Accept-Language": "ko-KR,ko;q=0.9" },
    });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url);
      continue;
    }
    if (!res.ok || !res.body) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) return null;

    const chunks: Uint8Array[] = [];
    let size = 0;
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks);
    // 글자 인코딩: 헤더 → 페이지 앞부분 meta 순서로 찾는다 (인크루트는 EUC-KR)
    const charset =
      /charset=["']?([\w-]+)/i.exec(type)?.[1] ??
      /<meta[^>]+charset=["']?([\w-]+)/i.exec(bytes.subarray(0, 4096).toString("latin1"))?.[1] ??
      "utf-8";
    try {
      return { html: new TextDecoder(charset.toLowerCase()).decode(bytes), finalUrl: url };
    } catch {
      return { html: new TextDecoder("utf-8").decode(bytes), finalUrl: url };
    }
  }
  return null;
}

const decodeEntities = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

const clean = (s: unknown) =>
  typeof s === "string" ? decodeEntities(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim() : "";

function metaContent(html: string, name: string) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*>`, "i");
  const tag = re.exec(html)?.[0];
  return tag ? clean(/content=["']([^"']*)["']/i.exec(tag)?.[1]) : "";
}

// 페이지 안의 JobPosting 정리 정보
function findJobPosting(html: string): Record<string, unknown> | null {
  const blocks = html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi);
  for (const [, raw] of blocks) {
    let data: unknown;
    try {
      data = JSON.parse(raw.trim());
    } catch {
      continue;
    }
    const items = Array.isArray(data) ? data : ((data as { "@graph"?: unknown[] })["@graph"] ?? [data]);
    for (const item of items) {
      if (item && typeof item === "object" && (item as { "@type"?: unknown })["@type"] === "JobPosting") {
        return item as Record<string, unknown>;
      }
    }
  }
  return null;
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: "정규직",
  PART_TIME: "아르바이트",
  CONTRACTOR: "계약직",
  TEMPORARY: "계약직",
  INTERN: "인턴",
  PER_DIEM: "아르바이트",
  VOLUNTEER: "기타",
};

function employmentFrom(value: unknown) {
  const list = (Array.isArray(value) ? value : [value]).map(clean).filter(Boolean);
  const labels = [...new Set(list.map((v) => EMPLOYMENT_LABELS[v.toUpperCase()] ?? v))];
  return labels.length ? labels.join(", ") : null;
}

function locationFrom(value: unknown) {
  const place = (Array.isArray(value) ? value[0] : value) as { address?: Record<string, unknown> } | undefined;
  const a = place?.address;
  if (!a) return null;
  const region = [clean(a.addressRegion), clean(a.addressLocality)].filter(Boolean).join(" ");
  if (region) return region;
  // 도로명 주소만 있으면 앞의 "시·구" 두 덩어리만
  const street = clean(a.streetAddress).split(" ").slice(0, 2).join(" ");
  return street || null;
}

// 마감 일시 → 한국 시간 기준으로 저장. 시각이 "23:59"(또는 자정)면 날짜만 아는 것으로 본다
function deadlineFrom(value: string): Pick<ExtractedPosting, "deadlineKind" | "deadlineAt" | "deadlineTimeKnown"> | null {
  const v = value.trim();
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(v);
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(v);
  const date = new Date(dateOnly ? `${v}T23:59:00+09:00` : hasZone ? v : `${v}+09:00`);
  if (Number.isNaN(date.getTime())) return null;
  const kstTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  if (dateOnly || kstTime === "23:59") {
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(date);
    return { deadlineKind: "date", deadlineAt: new Date(`${day}T23:59:00+09:00`).toISOString(), deadlineTimeKnown: false };
  }
  if (kstTime === "00:00") {
    // 자정 마감은 "그 전날 밤까지"인지 "그날까지"인지 사이트마다 달라 날짜만 두고 확인받는다
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(date);
    return { deadlineKind: "date", deadlineAt: new Date(`${day}T23:59:00+09:00`).toISOString(), deadlineTimeKnown: false };
  }
  return { deadlineKind: "date", deadlineAt: date.toISOString(), deadlineTimeKnown: true };
}

// 페이지 글에서 마감 날짜 찾기 (정리 정보에 마감일이 없을 때). "마감 2026.12.01" → "2026.11.01 ~ 2026.12.01" 의 뒤 날짜 순
const DATE = String.raw`(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})`;
function deadlineFromText(html: string) {
  const text = clean(html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " "));
  const m =
    new RegExp(`마감(?:일)?\\s*[:：]?\\s*${DATE}`).exec(text) ??
    new RegExp(String.raw`\d{4}[.\-/]\s*\d{1,2}[.\-/]\s*\d{1,2}[^0-9~]{0,20}~\s*${DATE}`).exec(text);
  if (!m) return null;
  const [y, mo, d] = m.slice(-3);
  return deadlineFrom(`${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`);
}

// 제목 앞 "[기업명]"·뒤 "(~11/4)" 같은 꼬리 떼기
const bareName = (s: string) => s.replace(/\(주\)|㈜|주식회사|\s/g, "");
function tidyTitle(title: string, company: string) {
  return title
    .replace(/\s*[-|]\s*(사람인|잡코리아|원티드|링커리어|캐치|인크루트)[^-|]*$/, "")
    .replace(/\s*\((?:~|D-)[^)]*\)\s*$/i, "")
    .replace(/^\s*\[([^\]]*)\]\s*/, (m, inner: string) => {
      const a = bareName(inner);
      const b = bareName(company);
      return a && b && (a.includes(b) || b.includes(a)) ? "" : m;
    })
    .trim();
}

type Draft = { posting: ExtractedPosting; deadlineUnsure: boolean };

function fromJobPosting(job: Record<string, unknown>, html: string): Draft {
  const company = clean((job.hiringOrganization as { name?: unknown } | undefined)?.name);
  const deadline =
    (typeof job.validThrough === "string" ? deadlineFrom(job.validThrough) : null) ?? deadlineFromText(html);
  const posting: ExtractedPosting = {
    company,
    jobTitle: tidyTitle(clean(job.title), company),
    deadlineKind: deadline?.deadlineKind ?? null,
    deadlineAt: deadline?.deadlineAt ?? null,
    deadlineTimeKnown: deadline?.deadlineTimeKnown ?? false,
    location: locationFrom(job.jobLocation),
    employmentType: employmentFrom(job.employmentType),
    companySize: null,
    requiredDocs: [],
    steps: DEFAULT_STEPS,
    unsure: [],
  };
  // 정리 정보에 마감일이 없어 글에서 찾았거나, 자정 마감(사이트마다 뜻이 달라서)이면 확인받는다
  const midnight = typeof job.validThrough === "string" && /T00:00(:00)?/.test(job.validThrough);
  return { posting, deadlineUnsure: deadline === null || typeof job.validThrough !== "string" || midnight };
}

// 사람인처럼 정리 정보가 없고 설명 한 줄에 "기업, 제목, 경력:…, 마감일:2026-11-02" 가 있는 페이지
function fromDescription(html: string): Draft | null {
  const desc = metaContent(html, "og:description") || metaContent(html, "description");
  const title = metaContent(html, "og:title") || clean(/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1]);
  if (!title) return null;

  const parts = desc.split(",").map((s) => s.trim());
  const bracket = /^\[([^\]]+)\]/.exec(title)?.[1]?.trim() ?? "";
  const company = bracket || (desc && !parts[0].includes(":") ? parts[0] : "");
  const due = /마감일\s*:\s*([^,]+)/.exec(desc)?.[1]?.trim() ?? "";
  const deadline = /^\d{4}-\d{2}-\d{2}/.test(due)
    ? deadlineFrom(due.slice(0, 10))
    : /채용\s*시/.test(due)
      ? { deadlineKind: "until_filled" as const, deadlineAt: null, deadlineTimeKnown: false }
      : /상시/.test(due)
        ? { deadlineKind: "rolling" as const, deadlineAt: null, deadlineTimeKnown: false }
        : deadlineFromText(html);

  const posting: ExtractedPosting = {
    company,
    jobTitle: tidyTitle(title, company),
    deadlineKind: deadline?.deadlineKind ?? null,
    deadlineAt: deadline?.deadlineAt ?? null,
    deadlineTimeKnown: deadline?.deadlineTimeKnown ?? false,
    location: null,
    employmentType: null,
    companySize: null,
    requiredDocs: [],
    steps: DEFAULT_STEPS,
    unsure: [],
  };
  return { posting, deadlineUnsure: deadline === null || !due };
}

// 공고 본문 글: 정리 정보 안의 본문(description) → 사람인은 같은 공고의 본문 페이지 → 없으면 페이지 전체
async function bodyLines(html: string, job: Record<string, unknown> | null, pageUrl: URL) {
  if (job && typeof job.description === "string" && job.description.length > 50) return htmlToLines(job.description);
  const recIdx = pageUrl.hostname.endsWith("saramin.co.kr") ? pageUrl.searchParams.get("rec_idx") : null;
  if (recIdx && /^\d+$/.test(recIdx)) {
    const detail = await fetchPage(`https://www.saramin.co.kr/zf_user/jobs/relay/view-detail?rec_idx=${recIdx}`).catch(() => null);
    if (detail) return htmlToLines(detail.html);
  }
  return htmlToLines(html);
}

// 본문의 "항목 : 값" 줄로 빈 칸 채우기. 정리 정보에 있는 값이 먼저다
function fillFromKeywords({ posting, deadlineUnsure }: Draft, text: string): Draft {
  const kw = readKeywordFields(text);
  const next = { ...posting };
  next.employmentType ||= kw.employmentType;
  if (kw.location && (!next.location || kw.location.length > next.location.length)) next.location = kw.location;
  if (kw.steps.length >= 2) next.steps = kw.steps;
  if (kw.requiredDocs.length) next.requiredDocs = kw.requiredDocs;
  let unsureDeadline = deadlineUnsure;
  if (!next.deadlineKind && kw.deadlineDate) {
    const d = deadlineFrom(kw.deadlineDate);
    if (d) Object.assign(next, d);
    unsureDeadline = true;
  }
  return { posting: next, deadlineUnsure: unsureDeadline };
}

// 비었거나 자신 없는 칸은 확인 화면에서 노랑으로
function withUnsure({ posting: p, deadlineUnsure }: Draft): ExtractedPosting {
  const unsure: string[] = [];
  if (!p.company) unsure.push("company");
  if (!p.jobTitle) unsure.push("jobTitle");
  if (deadlineUnsure || !p.deadlineKind) unsure.push("deadline");
  if (!p.location) unsure.push("location");
  if (!p.employmentType) unsure.push("employmentType");
  if (p.requiredDocs.length === 0) unsure.push("requiredDocs");
  if (p.steps === DEFAULT_STEPS) unsure.push("steps"); // 본문에서 못 찾아 기본 단계를 넣은 경우
  return { ...p, unsure };
}

export async function readPostingLink(url: string): Promise<LinkReadResult> {
  let page: Awaited<ReturnType<typeof fetchPage>>;
  try {
    page = await fetchPage(url);
  } catch {
    page = null;
  }
  if (!page) return { status: "unreadable", message: UNREADABLE };

  const job = findJobPosting(page.html);
  const draft = job ? fromJobPosting(job, page.html) : fromDescription(page.html);
  // 기업명도 직무도 못 찾았으면 읽은 것으로 보지 않는다
  if (!draft || (!draft.posting.company && !draft.posting.jobTitle)) return { status: "unreadable", message: UNREADABLE };
  const filled = fillFromKeywords(draft, await bodyLines(page.html, job, page.finalUrl));
  return { status: "ok", posting: withUnsure(filled) };
}
