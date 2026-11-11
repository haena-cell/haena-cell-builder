"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, House, List, ListChecks, Plus, Puzzle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppHref } from "@/components/postings/demo-context";
import { cn } from "@/lib/utils";

// 앱 메뉴 (D-16, DESIGN.md 5): 컴퓨터는 왼쪽 메뉴바, 휴대폰·태블릿은 아래 떠 있는 탭바 + [+]
const MENU = [
  { href: "/app", label: "홈", icon: House },
  { href: "/app/postings", label: "목록", icon: List },
  { href: "/app/calendar", label: "달력", icon: CalendarDays },
  { href: "/app/todos", label: "할 일", icon: ListChecks },
] as const;
// 컴퓨터 크롬에서만 쓰는 기능이라 왼쪽 메뉴바에만 (D-48)
const SIDE_ONLY = [{ href: "/app/extension", label: "확장 프로그램", icon: Puzzle }] as const;

// 첫 메뉴(홈)는 주소가 똑같을 때만 고른 것으로
const isActive = (pathname: string, href: string, home: string) =>
  href === home ? pathname === home : pathname.startsWith(href);

export function SideNav() {
  const pathname = usePathname();
  const toHref = useAppHref();
  return (
    <nav className="flex flex-col gap-1" aria-label="메뉴">
      {[...MENU, ...SIDE_ONLY].map(({ href: appHref, label, icon: Icon }) => {
        const href = toHref(appHref);
        const active = isActive(pathname, href, toHref("/app"));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-11 items-center gap-2.5 rounded-lg px-3 text-[15px] font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground [&_svg]:text-muted-foreground",
              active && "bg-muted font-semibold text-primary hover:text-primary [&_svg]:text-primary",
            )}
          >
            <Icon className="size-[18px]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

// 홈·목록·달력·할 일 화면에서만 보인다 (공고 넣기·상세에서는 숨김)
export function MobileNav() {
  const pathname = usePathname();
  const toHref = useAppHref();
  if (!MENU.some((m) => toHref(m.href) === pathname)) return null;
  return (
    <>
      <nav
        className="fixed bottom-4 left-3 z-20 flex gap-1 rounded-full bg-card p-1.5 shadow-soft ring-1 ring-border lg:hidden"
        aria-label="메뉴"
      >
        {MENU.map(({ href: appHref, label, icon: Icon }) => {
          const href = toHref(appHref);
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-12 w-14 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] text-muted-foreground transition-colors min-[400px]:w-16",
                active && "bg-muted font-semibold text-primary",
              )}
            >
              <Icon className="size-[18px]" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <Button size="icon-lg" className="fixed right-3 bottom-4 z-20 size-14 rounded-full shadow-soft lg:hidden" asChild>
        <Link href="/app/new" aria-label="공고 넣기">
          <Plus className="size-6" />
        </Link>
      </Button>
    </>
  );
}
