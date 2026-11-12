import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeSkeleton } from "@/components/postings/page-skeletons";
import { HomeDashboard } from "@/components/postings/home-dashboard";
import { PageBody, PageTitle } from "@/components/postings/page-title";
import { kstDateKey } from "@/lib/postings";
import { getMyPostingsSnapshot } from "@/lib/postings-db";

export const metadata: Metadata = {
  title: "홈",
};

// 홈 (D-25): 마감 임박 · 이번 달 달력 · 남은 할 일을 한눈에
async function Home() {
  const { postings, nowIso } = await getMyPostingsSnapshot();
  return <HomeDashboard initialPostings={postings} today={kstDateKey(new Date(nowIso))} />;
}

export default function AppHomePage() {
  return (
    <PageBody>
      <PageTitle title="홈" />
      <Suspense fallback={<HomeSkeleton />}>
        <Home />
      </Suspense>
    </PageBody>
  );
}
