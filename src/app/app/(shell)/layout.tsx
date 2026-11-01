import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";
import { MobileNav, SideNav } from "@/components/postings/app-nav";

// 로그인 뒤 앱 화면의 틀 (DESIGN.md 5): 컴퓨터는 왼쪽 메뉴바, 휴대폰은 위쪽 바 + 아래 탭바
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 bg-background">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 px-4 py-6 lg:flex">
        <Link href="/app" className="px-4 text-lg font-bold tracking-tight">
          이름 미정
        </Link>
        <Button size="lg" className="h-11" asChild>
          <Link href="/app/new">
            <Plus data-icon="inline-start" />
            공고 넣기
          </Link>
        </Button>
        <Suspense fallback={<div className="h-[140px]" />}>
          <SideNav />
        </Suspense>
        <div className="mt-auto">
          <Suspense fallback={<div className="h-12" />}>
            <UserMenu wide />
          </Suspense>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-background/85 px-4 backdrop-blur lg:hidden">
          <Link href="/app" className="text-base font-bold tracking-tight">
            이름 미정
          </Link>
          <Suspense fallback={<div className="size-10 rounded-full bg-muted" />}>
            <UserMenu />
          </Suspense>
        </header>
        {children}
      </div>

      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
    </div>
  );
}
