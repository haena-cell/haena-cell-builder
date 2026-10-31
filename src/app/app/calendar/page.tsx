import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { AppHeader } from "@/components/postings/app-header";
import { AddPostingButton } from "@/components/postings/add-posting-button";
import { PostingCalendar } from "@/components/postings/posting-calendar";
import { kstDateKey } from "@/lib/postings";
import { getMyPostings } from "@/lib/postings-db";

export const metadata: Metadata = {
  title: "달력",
};

// 공고 마감일을 월 달력으로. 내 계정(DB)의 공고를 보여 준다.
async function Calendar() {
  await connection();
  const now = new Date();
  return <PostingCalendar postings={await getMyPostings()} today={kstDateKey(now)} />;
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

        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" aria-label="달력을 불러오는 중" />}>
          <Calendar />
        </Suspense>
      </main>
    </div>
  );
}
