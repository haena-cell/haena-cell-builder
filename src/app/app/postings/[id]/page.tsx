import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostingDetail } from "@/components/postings/posting-detail";

export const metadata: Metadata = {
  title: "공고 상세",
};

export default function PostingDetailPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[720px] items-center gap-1 px-2 md:px-4">
          <Button variant="ghost" size="icon-lg" asChild>
            <Link href="/app" aria-label="목록으로">
              <ArrowLeft />
            </Link>
          </Button>
          <span className="text-base font-semibold">공고 상세</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 pt-6 pb-16 md:px-6 md:pt-10">
        <p className="rounded-lg bg-warning px-3 py-2 text-xs text-warning-foreground">
          연습용 예시예요. 체크·수정·삭제는 이 브라우저 탭에만 임시로 남아요.
        </p>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
          <PostingDetail />
        </Suspense>
      </main>
    </div>
  );
}
