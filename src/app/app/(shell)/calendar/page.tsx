import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageBody, PageTitle } from "@/components/postings/page-title";
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
    <PageBody>
      <PageTitle title="달력" />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-card" aria-label="달력을 불러오는 중" />}>
        <Calendar />
      </Suspense>
    </PageBody>
  );
}
