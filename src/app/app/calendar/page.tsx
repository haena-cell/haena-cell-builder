import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { AppHeader } from "@/components/postings/app-header";
import { AddPostingButton } from "@/components/postings/add-posting-button";
import { PostingCalendar } from "@/components/postings/posting-calendar";
import { kstDateKey } from "@/lib/postings";
import { makeSamplePostings } from "@/lib/sample-postings";

export const metadata: Metadata = {
  title: "달력",
};

// 공고 마감일을 월 달력으로. 지금은 연습용 예시 데이터로만 보여 준다.
async function Calendar() {
  await connection();
  const now = new Date();
  return <PostingCalendar initialPostings={makeSamplePostings(now)} today={kstDateKey(now)} />;
}

export default function CalendarPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <AppHeader active="calendar" />

      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 pt-6 pb-24 md:px-6 md:pt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">달력</h1>
            <p className="mt-1 text-sm text-muted-foreground">날짜를 누르면 그날 마감인 공고가 아래에 보여요.</p>
          </div>
          <AddPostingButton />
        </div>

        <p className="rounded-lg bg-warning px-3 py-2 text-xs text-warning-foreground">
          연습용 예시 공고예요. 이 브라우저 탭에 저장한 공고만 보이고, 탭을 닫으면 처음으로 돌아가요.
        </p>

        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" aria-label="달력을 불러오는 중" />}>
          <Calendar />
        </Suspense>
      </main>
    </div>
  );
}
