import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageBody, PageTitle } from "@/components/postings/page-title";
import { PostingDetail } from "@/components/postings/posting-detail";
import { demoPostings } from "@/lib/demo-postings";
import { otherDeadlines } from "@/lib/postings";

export const metadata: Metadata = {
  title: "공고 상세",
};

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const now = new Date();
  const { id } = await params;
  const all = demoPostings(now);
  const posting = all.find((p) => p.id === id);
  if (!posting) {
    return (
      <>
        <PageTitle title="공고를 찾을 수 없어요" back={{ href: "/demo/postings", label: "목록" }} />
        <Card className="items-start px-6">
          <Button size="lg" asChild>
            <Link href="/demo/postings">목록으로</Link>
          </Button>
        </Card>
      </>
    );
  }
  return <PostingDetail initialPosting={posting} nowIso={now.toISOString()} otherDeadlines={otherDeadlines(all, posting.id)} />;
}

export default function DemoPostingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <PageBody>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-card" />}>
        <Detail params={params} />
      </Suspense>
    </PageBody>
  );
}
