import { extractPosting, type ExtractInput } from "@/lib/extract-posting";

const MAX_TEXT = 20_000; // 글자
const MAX_IMAGE = 3_000_000; // data URL 길이 (줄인 캡처는 보통 0.5MB 이하)

function parseInput(body: unknown): ExtractInput | string {
  if (!body || typeof body !== "object") return "잘못된 요청이에요.";
  const b = body as Record<string, unknown>;

  if (b.kind === "link" && typeof b.url === "string") {
    try {
      const url = new URL(b.url.trim());
      if (url.protocol !== "http:" && url.protocol !== "https:") return "http 또는 https 주소를 넣어 주세요.";
      return { kind: "link", url: url.toString() };
    } catch {
      return "올바른 링크 주소가 아니에요.";
    }
  }
  if (b.kind === "text" && typeof b.text === "string") {
    const text = b.text.trim();
    if (text.length < 20) return "공고 글을 조금 더 붙여넣어 주세요.";
    if (text.length > MAX_TEXT) return "공고 글이 너무 길어요. 공고 부분만 붙여넣어 주세요.";
    return { kind: "text", text };
  }
  if (b.kind === "image" && typeof b.dataUrl === "string") {
    if (!/^data:image\/(jpeg|png|webp);base64,/.test(b.dataUrl)) return "이미지 파일만 올릴 수 있어요.";
    if (b.dataUrl.length > MAX_IMAGE) return "캡처가 너무 커요. 다른 캡처로 시도해 주세요.";
    return { kind: "image", dataUrl: b.dataUrl };
  }
  return "잘못된 요청이에요.";
}

// 공고 정리. 캡처는 정리에만 쓰고 저장하지 않는다 (D-08).
// 로그인한 사람만 부를 수 있다: 로그인 안 하면 proxy.ts 가 /api/* 를 401 로 막는다.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const input = parseInput(body);
  if (typeof input === "string") return Response.json({ error: input }, { status: 400 });

  try {
    return Response.json(await extractPosting(input));
  } catch {
    return Response.json({ error: "정리하지 못했어요. 다시 시도해 주세요." }, { status: 500 });
  }
}
