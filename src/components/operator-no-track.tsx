import { connection } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { isOperatorEmail } from "@/lib/operator";
import { MarkNoTrack } from "@/components/analytics";

// 운영자 계정으로 로그인해 있으면 이 기기를 이탈 분석에서 뺀다 (D-77). 이미 로그인해 둔 기기용
export async function OperatorNoTrack() {
  await connection();
  const user = await getCurrentUser();
  if (!isOperatorEmail(user?.email)) return null;
  return <MarkNoTrack />;
}
