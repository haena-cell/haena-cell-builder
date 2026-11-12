import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarSkeleton } from "@/components/postings/page-skeletons";
import { PageBody, PageTitle } from "@/components/postings/page-title";
import { PostingCalendar } from "@/components/postings/posting-calendar";
import { getDemoSnapshot } from "@/lib/demo-snapshot";
import { kstDateKey } from "@/lib/postings";

export const metadata: Metadata = {
  title: "달력",
};

async function Calendar() {
  const { postings, nowIso } = await getDemoSnapshot();
  const now = new Date(nowIso);
  return <PostingCalendar postings={postings} today={kstDateKey(now)} />;
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
