import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { PageBody, PageTitle } from "@/components/postings/page-title";
import { TodoBoard } from "@/components/postings/todo-board";
import { demoPostings } from "@/lib/demo-postings";
import { kstDateKey } from "@/lib/postings";

export const metadata: Metadata = {
  title: "할 일",
};

async function Todos() {
  await connection();
  const now = new Date();
  return <TodoBoard initialPostings={demoPostings(now)} today={kstDateKey(now)} />;
}

export default function DemoTodosPage() {
  return (
    <PageBody narrow>
      <PageTitle title="할 일" />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-card" aria-label="할 일을 불러오는 중" />}>
        <Todos />
      </Suspense>
    </PageBody>
  );
}
