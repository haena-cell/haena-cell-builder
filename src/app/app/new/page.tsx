import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewPostingForm } from "@/components/postings/new-posting-form";

export const metadata: Metadata = {
  title: "공고 넣기",
};

export default function NewPostingPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[720px] items-center gap-1 px-2 md:px-4">
          <Button variant="ghost" size="icon-lg" asChild>
            <Link href="/app" aria-label="목록으로">
              <ArrowLeft />
            </Link>
          </Button>
          <span className="text-base font-semibold">공고 넣기</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 pt-6 pb-16 md:px-6 md:pt-10">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">어떤 공고를 넣을까요?</h1>
          <p className="mt-1 text-sm text-muted-foreground">채용 공고 링크를 붙여넣으면 기업·직무·마감일을 정리해 드려요.</p>
        </div>

        <p className="rounded-lg bg-warning px-3 py-2 text-xs text-warning-foreground">
          연습용 예시예요. 아직 실제로 공고를 읽지 않고 예시 결과를 보여 드려요. 인스타그램 링크를 넣으면 &lsquo;읽을 수 없음&rsquo; 안내를 볼 수 있어요.
        </p>

        <NewPostingForm />
      </main>
    </div>
  );
}
