import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// 요청마다 로그인 상태를 새로 고치고, 로그인 안 한 사람은 /app 에 못 들어오게 한다 (D-06).
// 데이터 자체는 DB 의 행 단위 접근 규칙(RLS)이 한 번 더 막는다.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  // 공고 정리 기능: 로그인한 사람만 (실제 AI 비용 보호)
  if (pathname.startsWith("/api/")) {
    if (!loggedIn) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
    return response;
  }

  const isLogin = pathname === "/app/login";
  if (!loggedIn && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/app/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  if (loggedIn && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/app/:path*", "/app", "/api/:path*"],
};
