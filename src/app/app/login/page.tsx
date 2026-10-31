import type { Metadata } from "next";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { GoogleLoginButton } from "@/components/auth/google-login-button";

export const metadata: Metadata = {
  title: "로그인",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-background px-4 py-16">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">이름 미정</h1>
          <p className="text-sm text-muted-foreground">채용공고 링크만 붙여넣으면 마감일과 전형 단계를 정리해 드려요.</p>
        </div>
        <Suspense fallback={<Button size="lg" className="h-12 w-full text-base" disabled>Google로 계속하기</Button>}>
          <GoogleLoginButton />
        </Suspense>
        <p className="text-xs text-muted-foreground">연습용 서비스예요 · 가짜 공고로 먼저 써 보세요</p>
      </div>
    </main>
  );
}
