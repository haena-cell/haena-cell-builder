import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-next";
import { GA_OFF_COOKIE, isOperatorEmail } from "@/lib/operator";

// Google 계정 선택을 마치고 돌아오는 곳. 받은 코드를 로그인 정보로 바꾼 뒤 원래 화면으로 보낸다.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      // 이탈 분석(D-75): 로그인 끝을 화면에서 한 번 기록하게 짧은 표시만 남긴다(누구인지는 넣지 않음)
      const created = Date.parse(data.user?.created_at ?? "");
      const isNew = Number.isFinite(created) && Date.now() - created < 5 * 60 * 1000;
      response.cookies.set("hurdle_login", isNew ? "sign_up" : "login", { maxAge: 120, path: "/", sameSite: "lax" });
      // 운영자 계정이면 이 기기를 이탈 분석에서 뺀다 (D-77, 1년)
      if (isOperatorEmail(data.user?.email)) {
        response.cookies.set(GA_OFF_COOKIE, "1", { maxAge: 60 * 60 * 24 * 365, path: "/", sameSite: "lax" });
      }
      return response;
    }
  }
  return NextResponse.redirect(`${origin}/app/login?error=1&next=${encodeURIComponent(next)}`);
}
