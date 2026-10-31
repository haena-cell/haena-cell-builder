import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

// 서버 화면·서버 기능에서 쓰는 Supabase 연결. 로그인 정보는 쿠키에서 읽는다.
export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // 화면을 그리는 중에는 쿠키를 쓸 수 없다. 로그인 유지는 proxy.ts 가 맡는다.
          }
        },
      },
    },
  );
}

export type CurrentUser = { id: string; email: string | null; name: string | null; avatarUrl: string | null };

// 지금 로그인한 사람. 없으면 null.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const text = (v: unknown) => (typeof v === "string" && v ? v : null);
  return {
    id: claims.sub,
    email: text(claims.email),
    name: text(meta.full_name) ?? text(meta.name),
    avatarUrl: text(meta.avatar_url) ?? text(meta.picture),
  };
}
