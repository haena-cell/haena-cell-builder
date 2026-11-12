import type { Metadata } from "next";
import { Suspense } from "react";
import { PostingListSkeleton } from "@/components/postings/page-skeletons";
import { PageBody, PageTitle } from "@/components/postings/page-title";
import { PostingList } from "@/components/postings/posting-list";
import { getDemoSnapshot } from "@/lib/demo-snapshot";
import { daysLeftFor } from "@/lib/postings";

export const metadata: Metadata = {
  title: "내 공고",
};

async function Postings() {
  const { postings, nowIso } = await getDemoSnapshot();
  const now = new Date(nowIso);
  const daysLeft = Object.fromEntries(postings.map((p) => [p.id, daysLeftFor(p, now)]));
  return <PostingList initialPostings={postings} daysLeft={daysLeft} />;
}

export default function DemoPostingsPage() {
  return (
    <PageBody>
      <PageTitle title="내 공고" />
      <Suspense fallback={<PostingListSkeleton />}>
        <Postings />
      </Suspense>
    </PageBody>
  );
}
