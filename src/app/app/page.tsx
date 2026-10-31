import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { AppHeader } from "@/components/postings/app-header";
import { AddPostingButton } from "@/components/postings/add-posting-button";
import { PostingList } from "@/components/postings/posting-list";
import { daysLeftFor } from "@/lib/postings";
import { makeSamplePostings } from "@/lib/sample-postings";

export const metadata: Metadata = {
  title: "내 공고",
};

// 4단계 대표 화면: 공고 목록. 지금은 연습용 예시 데이터로만 보여 준다.
async function Postings() {
  await connection();
  const now = new Date();
  const postings = makeSamplePostings(now);
  const daysLeft = Object.fromEntries(
    postings.map((p) => [p.id, daysLeftFor(p, now)]),
  );
  return <PostingList initialPostings={postings} daysLeft={daysLeft} />;
}

function PostingsSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-label="공고를 불러오는 중">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export default function AppHomePage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <AppHeader active="list" />

      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 pt-6 pb-24 md:px-6 md:pt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">내 공고</h1>
            <p className="mt-1 text-sm text-muted-foreground">마감이 가까운 순서로 보여 드려요.</p>
          </div>
          <AddPostingButton />
        </div>

        <p className="rounded-lg bg-warning px-3 py-2 text-xs text-warning-foreground">
          연습용 예시 공고예요. [제출 완료]·체크·저장은 이 브라우저 탭에만 임시로 남고, 탭을 닫으면 처음으로 돌아가요.
        </p>

        <Suspense fallback={<PostingsSkeleton />}>
          <Postings />
        </Suspense>
      </main>
    </div>
  );
}
