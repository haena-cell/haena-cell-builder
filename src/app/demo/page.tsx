import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { HomeDashboard } from "@/components/postings/home-dashboard";
import { PageBody, PageTitle } from "@/components/postings/page-title";
import { demoPostings } from "@/lib/demo-postings";
import { kstDateKey } from "@/lib/postings";

export const metadata: Metadata = {
  title: "홈",
};

async function Home() {
  await connection();
  const now = new Date();
  return <HomeDashboard initialPostings={demoPostings(now)} today={kstDateKey(now)} />;
}

export default function DemoHomePage() {
  return (
    <PageBody>
      <PageTitle title="홈" description="마감이 가까운 공고와 남은 할 일이에요." />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-card md:rounded-[28px]" aria-label="불러오는 중" />}>
        <Home />
      </Suspense>
    </PageBody>
  );
}
