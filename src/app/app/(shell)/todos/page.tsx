import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageBody, PageTitle } from "@/components/postings/page-title";
import { TodoBoard } from "@/components/postings/todo-board";
import { kstDateKey } from "@/lib/postings";
import { getMyPostings } from "@/lib/postings-db";

export const metadata: Metadata = {
  title: "할 일",
};

// 모든 공고의 준비 항목 할 일 모아보기 (D-20)
async function Todos() {
  await connection();
  return <TodoBoard initialPostings={await getMyPostings()} today={kstDateKey(new Date())} />;
}

export default function TodosPage() {
  return (
    <PageBody narrow>
      <PageTitle title="할 일" description="공고마다 준비할 일을 모아 봐요. 추가·수정은 공고 상세에서 해요." />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-card" aria-label="할 일을 불러오는 중" />}>
        <Todos />
      </Suspense>
    </PageBody>
  );
}
