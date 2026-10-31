import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { AppHeader } from "@/components/postings/app-header";
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
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <AppHeader active="todos" />

      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 pt-6 pb-24 md:px-6 md:pt-10">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">할 일</h1>
          <p className="mt-1 text-sm text-muted-foreground">공고마다 준비할 일을 모아 봐요. 추가·수정은 공고 상세에서 해요.</p>
        </div>

        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" aria-label="할 일을 불러오는 중" />}>
          <Todos />
        </Suspense>
      </main>
    </div>
  );
}
