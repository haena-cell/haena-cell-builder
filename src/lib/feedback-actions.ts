"use server";

import { createSupabaseServer } from "@/lib/supabase/server";

// 의견 보내기 (D-36). 로그인 없이도 보낼 수 있고 앱에서는 읽을 수 없다(DB 접근 규칙). 운영자가 대시보드에서 읽는다
export async function sendFeedback(input: {
  message: string;
  contact?: string;
  page?: string;
  website?: string; // 사람에게는 안 보이는 칸: 채워져 있으면 자동 프로그램으로 본다
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const message = input.message?.trim() ?? "";
  const contact = input.contact?.trim() ?? "";
  if (input.website) return { ok: true };
  if (!message) return { ok: false, message: "의견을 적어 주세요." };
  if (message.length > 2000) return { ok: false, message: "의견은 2000자까지 보낼 수 있어요." };
  if (contact && (contact.length > 200 || !/^\S+@\S+\.\S+$/.test(contact))) {
    return { ok: false, message: "이메일 주소를 확인해 주세요. 비워 두어도 괜찮아요." };
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("feedback").insert({
    message,
    contact: contact || null,
    page: input.page?.slice(0, 200) || null,
  });
  if (error?.message.includes("feedback rate limit")) {
    // 횟수 제한 (D-79): 한 계정 10분 5개, 전체 1시간 30개
    return { ok: false, message: "의견이 잠깐 많이 몰렸어요. 조금 뒤에 다시 보내 주세요." };
  }
  return error ? { ok: false, message: "보내지 못했어요. 잠시 뒤 다시 시도해 주세요." } : { ok: true };
}
