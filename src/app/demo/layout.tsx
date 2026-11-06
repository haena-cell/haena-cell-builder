import { Suspense } from "react";
import { BrandName } from "@/components/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { Eye, LogIn, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BetaBadge } from "@/components/beta-badge";
import { FeedbackButton } from "@/components/feedback-button";
import { MobileNav, SideNav } from "@/components/postings/app-nav";
import { DemoProvider } from "@/components/postings/demo-context";

export const metadata: Metadata = {
  title: { default: "둘러보기", template: "%s (둘러보기) · Pacemate" },
};

// 로그인 없이 둘러보기 (D-34): 앱과 같은 틀. 공고 넣기·시작하기는 로그인 화면으로 간다
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <div className="flex min-h-full flex-1 bg-background">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 px-4 py-6 lg:flex">
          <div className="flex items-center gap-2 px-4">
            <Link href="/">
              <BrandName />
            </Link>
            <BetaBadge />
          </div>
          <Button size="lg" className="h-11" asChild>
            <Link href="/app/new">
              <Plus data-icon="inline-start" />
              공고 넣기
            </Link>
          </Button>
          <Suspense fallback={<div className="h-[188px]" />}>
            <SideNav />
          </Suspense>
          <div className="mt-auto flex flex-col gap-2">
            <FeedbackButton className="self-start" />
            <Button variant="outline" size="lg" className="h-11 w-full" asChild>
              <Link href="/app">
                <LogIn data-icon="inline-start" />
                Google로 시작하기
              </Link>
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-background/85 px-4 backdrop-blur lg:hidden">
            <div className="flex items-center gap-2">
              <Link href="/">
                <BrandName size="sm" />
              </Link>
              <BetaBadge />
            </div>
            <div className="flex items-center gap-1">
              <FeedbackButton />
              <Button size="sm" asChild>
                <Link href="/app">시작하기</Link>
              </Button>
            </div>
          </header>
          <div className="mx-auto w-full max-w-[1160px] px-3 pt-2 lg:px-4 lg:pt-6">
            <p className="flex items-start gap-2 rounded-2xl bg-info px-4 py-2.5 text-sm text-info-foreground" role="status">
              <Eye className="mt-0.5 size-4 shrink-0" />
              둘러보기 중이에요. 모두 가상의 회사와 공고이고, 바꾼 내용은 저장되지 않아요.
            </p>
          </div>
          {children}
        </div>

        <Suspense fallback={null}>
          <MobileNav />
        </Suspense>
      </div>
    </DemoProvider>
  );
}
