import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarSkeleton } from "@/components/postings/page-skeletons";
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
      <PageTitle title="달력" />
      <Suspense fallback={<CalendarSkeleton />}>
        <Calendar />
      </Suspense>
    </PageBody>
  );
}
