import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageBody, PageTitle } from "@/components/postings/page-title";
import { PostingDetail } from "@/components/postings/posting-detail";
import { getMyPosting, getMyPostings } from "@/lib/postings-db";
import { otherDeadlines } from "@/lib/postings";

export const metadata: Metadata = {
  title: "공고 상세",
};

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const id = (await params).id;
  const [posting, all] = await Promise.all([getMyPosting(id), getMyPostings()]);
  if (!posting) {
    return (
      <>
        <PageTitle title="공고를 찾을 수 없어요" back={{ href: "/app/postings", label: "목록" }} />
        <Card className="items-start px-6">
          <p className="text-sm text-muted-foreground">지워졌거나 주소가 잘못됐을 수 있어요.</p>
          <Button size="lg" asChild>
            <Link href="/app/postings">목록으로</Link>
          </Button>
        </Card>
      </>
    );
  }
  return <PostingDetail initialPosting={posting} nowIso={new Date().toISOString()} otherDeadlines={otherDeadlines(all, posting.id)} />;
}

export default function PostingDetailPage({ params }: PageProps<"/app/postings/[id]">) {
  return (
    <PageBody>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-card" />}>
        <Detail params={params} />
      </Suspense>
    </PageBody>
  );
}
