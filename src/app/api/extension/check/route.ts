import { findSavedByLink } from "@/lib/posting-actions";

// 크롬 확장 팝업 (D-47): 로그인 확인 + 이미 저장한 링크인지. 로그인 안 하면 proxy.ts 가 401 로 막는다
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url") ?? "";
  const existing = url ? await findSavedByLink(url) : null;
  return Response.json({ existing });
}
