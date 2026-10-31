import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostingDetail } from "@/components/postings/posting-detail";
import { getMyPosting } from "@/lib/postings-db";

export const metadata: Metadata = {
  title: "공고 상세",
};

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const posting = await getMyPosting((await params).id);
  if (!posting) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-border p-6">
        <p className="font-semibold">공고를 찾을 수 없어요</p>
        <p className="text-sm text-muted-foreground">지워졌거나 주소가 잘못됐을 수 있어요.</p>
        <Button size="lg" className="px-4" asChild>
          <Link href="/app">목록으로</Link>
        </Button>
      </div>
    );
  }
  return <PostingDetail initialPosting={posting} nowIso={new Date().toISOString()} />;
}

export default function PostingDetailPage({ params }: PageProps<"/app/postings/[id]">) {
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
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
          <Detail params={params} />
        </Suspense>
      </main>
    </div>
  );
}
