import type { Metadata } from "next";
import { Suspense } from "react";
import { TodosSkeleton } from "@/components/postings/page-skeletons";
import { PageBody, PageTitle } from "@/components/postings/page-title";
import { TodoBoard } from "@/components/postings/todo-board";
import { getDemoSnapshot } from "@/lib/demo-snapshot";
import { kstDateKey } from "@/lib/postings";

export const metadata: Metadata = {
  title: "할 일",
};

async function Todos() {
  const { postings, nowIso } = await getDemoSnapshot();
  const now = new Date(nowIso);
  return <TodoBoard initialPostings={postings} today={kstDateKey(now)} />;
}

export default function DemoTodosPage() {
  return (
    <PageBody narrow>
      <PageTitle title="할 일" />
      <Suspense fallback={<TodosSkeleton />}>
        <Todos />
      </Suspense>
    </PageBody>
  );
}
