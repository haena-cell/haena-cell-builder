import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeSkeleton } from "@/components/postings/page-skeletons";
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
      <PageTitle title="홈" />
      <Suspense fallback={<HomeSkeleton />}>
        <Home />
      </Suspense>
    </PageBody>
  );
}
