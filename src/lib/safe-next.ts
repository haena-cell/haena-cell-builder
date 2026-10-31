// 로그인 뒤 돌아갈 주소. 다른 사이트로 보내지 않도록 /app 안쪽 주소만 받는다.
export function safeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/app") || next.startsWith("/app/login")) return "/app";
  if (next.startsWith("//") || next.includes("\\")) return "/app";
  return next;
}
