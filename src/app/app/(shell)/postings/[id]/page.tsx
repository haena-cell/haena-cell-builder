import type { Metadata } from "next";
import { Suspense } from "react";
import { PostingDetailSkeleton } from "@/components/postings/page-skeletons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageBody, PageTitle } from "@/components/postings/page-title";
import { PostingDetail } from "@/components/postings/posting-detail";
import { getMyPostingsSnapshot } from "@/lib/postings-db";
import { companyHistory, otherDeadlines } from "@/lib/postings";

export const metadata: Metadata = {
  title: "공고 상세",
};

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const { postings: all, nowIso } = await getMyPostingsSnapshot();
  const posting = all.find((p) => p.id === id);
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
  return <PostingDetail initialPosting={posting} nowIso={nowIso} otherDeadlines={otherDeadlines(all, posting.id)} history={companyHistory(posting, all)} />;
}

export default function PostingDetailPage({ params }: PageProps<"/app/postings/[id]">) {
  return (
    <PageBody>
      <Suspense fallback={<PostingDetailSkeleton />}>
        <Detail params={params} />
      </Suspense>
    </PageBody>
  );
}
