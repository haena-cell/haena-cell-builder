import type { Metadata } from "next";
import { Suspense } from "react";
import { TodosSkeleton } from "@/components/postings/page-skeletons";
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
      <PageTitle title="할 일" />
      <Suspense fallback={<TodosSkeleton />}>
        <Todos />
      </Suspense>
    </PageBody>
  );
}
