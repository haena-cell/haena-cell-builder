import { Suspense } from "react";
import Link from "next/link";
import { CalendarDays, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";

// 목록·달력 화면 위쪽 바: 서비스 이름 + [목록]/[달력] 탭 + 프로필 사진(로그아웃)
export function AppHeader({ active }: { active: "list" | "calendar" }) {
  const tabs = [
    { key: "list", href: "/app", label: "목록", icon: List },
    { key: "calendar", href: "/app/calendar", label: "달력", icon: CalendarDays },
  ] as const;

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[720px] items-center justify-between px-4 md:px-6">
        <span className="text-base font-bold tracking-tight">이름 미정</span>
        <nav className="flex items-center gap-1" aria-label="보기 전환">
          {tabs.map(({ key, href, label, icon: Icon }) => (
            <Button key={key} variant="ghost" size="lg" className={cn(active === key && "bg-muted")} asChild>
              <Link href={href} aria-current={active === key ? "page" : undefined}>
                <Icon data-icon="inline-start" />
                {label}
              </Link>
            </Button>
          ))}
          <Suspense fallback={<div className="ml-1 size-9 rounded-full bg-muted" />}>
            <div className="ml-1">
              <UserMenu />
            </div>
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
