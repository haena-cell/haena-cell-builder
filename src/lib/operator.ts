// 운영자 계정인지 (서버에서만). 운영자 이메일은 Vercel·.env.local 의 OPERATOR_EMAILS(쉼표로 여러 개)에만 둔다 — 화면·코드에 쓰지 않는다
export function isOperatorEmail(email: string | null | undefined) {
  if (!email) return false;
  const list = (process.env.OPERATOR_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

// 이 기기를 이탈 분석에서 빼는 표시 (D-77). 브라우저(components/analytics)도 같은 이름을 쓴다
export const GA_OFF_COOKIE = "hurdle_ga_off";
