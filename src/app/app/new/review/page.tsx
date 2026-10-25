import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/components/postings/review-form";

export const metadata: Metadata = {
  title: "정리 결과 확인",
};

export default function ReviewPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[720px] items-center gap-1 px-2 md:px-4">
          <Button variant="ghost" size="icon-lg" asChild>
            <Link href="/app/new" aria-label="공고 넣기로">
              <ArrowLeft />
            </Link>
          </Button>
          <span className="text-base font-semibold">정리 결과 확인</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 pt-6 pb-16 md:px-6 md:pt-10">
        <p className="rounded-lg bg-warning px-3 py-2 text-xs text-warning-foreground">
          연습용 예시예요. [저장]하면 이 브라우저 탭에만 임시로 저장되고, 탭을 닫으면 사라져요. 실제 저장은 로그인을 만든 뒤 연결해요.
        </p>
        <ReviewForm />
      </main>
    </div>
  );
}
