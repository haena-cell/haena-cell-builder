"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/safe-next";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}

export function GoogleLoginButton() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(searchParams.get("error") !== null);

  async function signIn() {
    setLoading(true);
    setFailed(false);
    const next = safeNextPath(searchParams.get("next"));
    const { error } = await createSupabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    // 성공하면 Google 창으로 넘어가므로, 여기 남아 있다면 실패한 것
    if (error) {
      setLoading(false);
      setFailed(true);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {failed && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          로그인하지 못했어요. 다시 시도해 주세요
        </p>
      )}
      <Button size="lg" className="h-12 w-full text-base" onClick={signIn} disabled={loading}>
        {!loading && <GoogleIcon />}
        {loading ? "연결 중…" : failed ? "다시 시도" : "Google로 계속하기"}
      </Button>
    </div>
  );
}
