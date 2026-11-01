import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// 화면 제목 (DESIGN.md 3): 28px 굵게, 휴대폰 22px. 뒤로 가기는 제목 위 작은 링크
export function PageTitle({
  title,
  description,
  back,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 px-1">
      {back && (
        <Link
          href={back.href}
          className="-ml-1 inline-flex items-center gap-1 self-start rounded-full px-1 py-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-tight lg:text-[28px]">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

// 화면 본문 영역: 판 사이 16px, 휴대폰은 아래 탭바만큼 여백
export function PageBody({ children, narrow = false }: { children: React.ReactNode; narrow?: boolean }) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full flex-col gap-4 px-3 pt-2 pb-28 lg:px-4 lg:pt-8 lg:pb-12",
        narrow ? "max-w-[760px]" : "max-w-[1160px]",
      )}
    >
      {children}
    </main>
  );
}
