import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { HomeDashboard } from "@/components/postings/home-dashboard";
import { PageBody, PageTitle } from "@/components/postings/page-title";
import { kstDateKey } from "@/lib/postings";
import { getMyPostings } from "@/lib/postings-db";

export const metadata: Metadata = {
  title: "홈",
};

// 홈 (D-25): 마감 임박 · 이번 달 달력 · 남은 할 일을 한눈에
async function Home() {
  await connection();
  return <HomeDashboard initialPostings={await getMyPostings()} today={kstDateKey(new Date())} />;
}

export default function AppHomePage() {
  return (
    <PageBody>
      <PageTitle title="홈" />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-card" aria-label="불러오는 중" />}>
        <Home />
      </Suspense>
    </PageBody>
  );
}
