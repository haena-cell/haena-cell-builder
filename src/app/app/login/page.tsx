import type { Metadata } from "next";
import Link from "next/link";
import { Mascot } from "@/components/mascot";
import { Wordmark } from "@/components/brand";
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

// 계정 삭제 뒤 돌아왔을 때 알림 (D-51). 주소의 값을 읽으므로 Suspense 안에서 그린다
async function DeletedNotice({ searchParams }: { searchParams: PageProps<"/app/login">["searchParams"] }) {
  const { deleted } = await searchParams;
  if (deleted !== "1") return null;
  return <p role="status" className="-my-4 rounded-2xl bg-muted px-4 py-3 text-sm">계정과 저장한 공고를 모두 지웠어요.</p>;
}

export default function LoginPage({ searchParams }: PageProps<"/app/login">) {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-background px-3 py-16">
      <Card className="w-full max-w-sm items-center gap-8 px-6 py-10 text-center md:px-8 md:py-12">
        <BetaBadge className="-mt-2 h-5 px-2 text-[11px]" />
        <Suspense fallback={null}>
          <DeletedNotice searchParams={searchParams} />
        </Suspense>
        <div className="flex flex-col items-center gap-3">
          <Mascot pose="sit" size={120} hop className="-mt-2" />
          <h1 className="text-[32px] leading-none text-foreground" aria-label="Hurdle"><Wordmark /></h1>
          <p className="text-sm text-muted-foreground">채용공고 링크만 붙여넣으면 마감일과 전형 단계를 정리해 드려요.</p>
        </div>
        <Suspense fallback={<Button size="lg" className="h-12 w-full text-base" disabled>Google로 계속하기</Button>}>
          <GoogleLoginButton />
        </Suspense>
        <DemoButton className="-mt-4 h-12 w-full text-base" />
        <p className="-mt-4 text-xs text-muted-foreground">
          계속하면 <Link href="/privacy" className="underline underline-offset-4">개인정보처리방침</Link>을 확인한 것으로 봐요.
        </p>
        <FeedbackButton className="-mt-6 text-muted-foreground" />
      </Card>
    </main>
  );
}
