import type { Metadata } from "next";
import { Suspense } from "react";
import { PostingListSkeleton } from "@/components/postings/page-skeletons";
import { connection } from "next/server";
import { PageBody, PageTitle } from "@/components/postings/page-title";
import { PostingList } from "@/components/postings/posting-list";
import { daysLeftFor } from "@/lib/postings";
import { getMyPostings } from "@/lib/postings-db";

export const metadata: Metadata = {
  title: "내 공고",
};

// 공고 목록: 내 계정(DB)의 공고. 처음엔 연습용 예시 3개가 들어 있다.
async function Postings() {
  await connection();
  const now = new Date();
  const postings = await getMyPostings();
  const daysLeft = Object.fromEntries(
    postings.map((p) => [p.id, daysLeftFor(p, now)]),
  );
  return <PostingList initialPostings={postings} daysLeft={daysLeft} />;
}


export default function PostingsPage() {
  return (
    <PageBody>
      <PageTitle title="내 공고" />
      <Suspense fallback={<PostingListSkeleton />}>
        <Postings />
      </Suspense>
    </PageBody>
  );
}
