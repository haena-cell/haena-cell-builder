"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, List, ListChecks, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 앱 메뉴 (D-16, DESIGN.md 5): 컴퓨터는 왼쪽 메뉴바, 휴대폰·태블릿은 아래 떠 있는 탭바 + [+]
const MENU = [
  { href: "/app", label: "목록", icon: List },
  { href: "/app/calendar", label: "달력", icon: CalendarDays },
  { href: "/app/todos", label: "할 일", icon: ListChecks },
] as const;

const isActive = (pathname: string, href: string) =>
  href === "/app" ? pathname === "/app" || pathname.startsWith("/app/postings") : pathname.startsWith(href);

export function SideNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="메뉴">
      {MENU.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-11 items-center gap-3 rounded-full px-4 text-[15px] text-muted-foreground transition-colors hover:text-foreground",
              active && "bg-card font-semibold text-foreground shadow-soft",
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

// 목록·달력·할 일 화면에서만 보인다 (공고 넣기·상세에서는 숨김)
export function MobileNav() {
  const pathname = usePathname();
  if (!MENU.some((m) => m.href === pathname)) return null;
  return (
    <>
      <nav
        className="fixed bottom-4 left-3 z-20 flex gap-1 rounded-full bg-card p-1.5 shadow-soft ring-1 ring-border lg:hidden"
        aria-label="메뉴"
      >
        {MENU.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-1.5 rounded-full px-3.5 text-sm text-muted-foreground transition-colors",
                active && "bg-primary font-semibold text-primary-foreground",
              )}
            >
              <Icon className="size-[18px]" />
              <span className="max-[359px]:sr-only">{label}</span>
            </Link>
          );
        })}
      </nav>
      <Button size="icon-lg" className="fixed right-3 bottom-4 z-20 size-14 lg:hidden" asChild>
        <Link href="/app/new" aria-label="공고 넣기">
          <Plus className="size-6" />
        </Link>
      </Button>
    </>
  );
}
