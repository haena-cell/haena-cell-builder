"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/app/login");
}

// 계정 삭제 (D-51): 본인 계정과 공고·단계·준비 항목·할 일을 모두 지운다. 되돌릴 수 없다
export async function deleteAccount(): Promise<{ ok: false; message: string } | never> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { ok: false, message: "계정을 지우지 못했어요. 잠시 뒤 다시 시도해 주세요." };
  // 계정이 없어졌으니 이 브라우저의 로그인 쿠키도 지운다 (실패해도 계속)
  await supabase.auth.signOut({ scope: "local" }).catch(() => {});
  redirect("/app/login?deleted=1");
}
