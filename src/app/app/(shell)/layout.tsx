import { Suspense } from "react";
import { BrandName } from "@/components/brand";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";
import { BetaBadge } from "@/components/beta-badge";
import { FeedbackButton } from "@/components/feedback-button";
import { RefreshOnReturn } from "@/components/refresh-on-return";
import { MobileNav, SideNav } from "@/components/postings/app-nav";

// 로그인 뒤 앱 화면의 틀 (DESIGN.md 5): 컴퓨터는 왼쪽 메뉴바, 휴대폰은 위쪽 바 + 아래 탭바
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 bg-background">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-border-subtle bg-card px-4 py-6 lg:flex">
        <div className="flex items-center gap-2 px-4">
          <Link href="/app">
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
        <Suspense fallback={<div className="h-[140px]" />}>
          <SideNav />
        </Suspense>
        <div className="mt-auto flex flex-col gap-2">
          <FeedbackButton className="self-start" />
          <Suspense fallback={<div className="h-12" />}>
            <UserMenu wide />
          </Suspense>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border-subtle bg-card/90 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <Link href="/app">
              <BrandName size="sm" />
            </Link>
            <BetaBadge />
          </div>
          <div className="flex items-center gap-1">
            <FeedbackButton />
            <Suspense fallback={<div className="size-10 rounded-full bg-muted" />}>
              <UserMenu />
            </Suspense>
          </div>
        </header>
        {children}
      </div>

      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
      <RefreshOnReturn />
    </div>
  );
}
