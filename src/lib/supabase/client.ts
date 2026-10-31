import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

// 브라우저에서 쓰는 Supabase 연결 (로그인 버튼 등). 로그인 정보는 쿠키에 둔다.
export function createSupabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
