import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageBody, PageTitle } from "@/components/postings/page-title";
import { PostingCalendar } from "@/components/postings/posting-calendar";
import { demoPostings } from "@/lib/demo-postings";
import { kstDateKey } from "@/lib/postings";

export const metadata: Metadata = {
  title: "달력",
};

async function Calendar() {
  await connection();
  const now = new Date();
  return <PostingCalendar postings={demoPostings(now)} today={kstDateKey(now)} />;
}

export default function DemoCalendarPage() {
  return (
    <PageBody>
      <PageTitle title="달력" description="날짜를 누르면 그날 마감인 공고가 보여요." />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-card" aria-label="달력을 불러오는 중" />}>
        <Calendar />
      </Suspense>
    </PageBody>
  );
}
