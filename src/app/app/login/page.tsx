import type { Metadata } from "next";
import { BrandMark } from "@/components/brand";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { BetaBadge } from "@/components/beta-badge";
import { FeedbackButton } from "@/components/feedback-button";
import { DemoButton } from "@/components/start-button";

export const metadata: Metadata = {
  title: "로그인",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-background px-3 py-16">
      <Card className="w-full max-w-sm items-center gap-8 px-6 py-10 text-center md:px-8 md:py-12">
        <BetaBadge className="-mt-2 h-5 px-2 text-[11px]" />
        <div className="flex flex-col items-center gap-3">
          <BrandMark className="size-14 text-3xl font-bold" />
          <h1 className="text-2xl font-bold tracking-tight">Pacemate</h1>
          <p className="text-sm text-muted-foreground">채용공고 링크만 붙여넣으면 마감일과 전형 단계를 정리해 드려요.</p>
        </div>
        <Suspense fallback={<Button size="lg" className="h-12 w-full text-base" disabled>Google로 계속하기</Button>}>
          <GoogleLoginButton />
        </Suspense>
        <DemoButton className="-mt-4 h-12 w-full text-base" />
        <FeedbackButton className="-mt-4 text-muted-foreground" />
      </Card>
    </main>
  );
}
