import { createSupabaseServer } from "@/lib/supabase/server";

// AI 정리를 지금 써도 되는지 (D-80). 서버에서만 부른다.
// 1) 크레딧이 끝나는 2026-11-21(UTC) 부터는 AI 를 쓰지 않는다. 유료로 다시 켜려면 Vercel 환경변수 AI_UNTIL 을 늦은 날짜로(예: 2027-12-31T00:00:00Z)
// 2) 한 사람 하루 20번(한국 날짜). DB 함수 use_ai_quota() 가 세고, 쓸 수 있으면 1번을 바로 차감한다

const AI_UNTIL = process.env.AI_UNTIL || "2026-11-21T00:00:00Z";
export const AI_DAILY_LIMIT = 20; // DB 함수 안의 숫자와 같아야 한다

export type AiGate = "ok" | "limit" | "off";

export function aiTurnedOff() {
  const until = Date.parse(AI_UNTIL);
  return Number.isFinite(until) && Date.now() >= until;
}

export async function takeAiTurn(): Promise<AiGate> {
  if (aiTurnedOff()) return "off";
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("use_ai_quota");
  if (error) {
    console.error(`AI 한도 확인 실패: ${error.message.slice(0, 200)}`);
    return "limit"; // 확인을 못 하면 비용 보호를 위해 쓰지 않는다
  }
  return data ? "ok" : "limit";
}

export const AI_GATE_HINT: Record<Exclude<AiGate, "ok">, string> = {
  limit: `오늘 AI 정리 ${AI_DAILY_LIMIT}번을 다 써서 키워드로만 정리했어요. 노란 칸을 확인해 주세요. 내일 다시 쓸 수 있어요.`,
  off: "지금은 AI 정리를 쉬고 있어서 키워드로만 정리했어요. 노란 칸을 확인해 주세요.",
};

export const AI_GATE_IMAGE: Record<Exclude<AiGate, "ok">, string> = {
  limit: `오늘 AI 정리 ${AI_DAILY_LIMIT}번을 다 써서 캡처를 읽을 수 없어요. 공고 글을 복사해 붙여넣어 주세요.`,
  off: "지금은 캡처 읽기를 쉬고 있어요. 공고 글을 복사해 붙여넣어 주세요.",
};
