import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeSkeleton } from "@/components/postings/page-skeletons";
import { HomeDashboard } from "@/components/postings/home-dashboard";
import { PageBody, PageTitle } from "@/components/postings/page-title";
import { getDemoSnapshot } from "@/lib/demo-snapshot";
import { kstDateKey } from "@/lib/postings";

export const metadata: Metadata = {
  title: "홈",
};

async function Home() {
  const { postings, nowIso } = await getDemoSnapshot();
  const now = new Date(nowIso);
  return <HomeDashboard initialPostings={postings} today={kstDateKey(now)} />;
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
