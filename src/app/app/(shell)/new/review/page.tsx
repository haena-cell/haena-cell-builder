import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { PageBody, PageTitle } from "@/components/postings/page-title";
import { ReviewForm } from "@/components/postings/review-form";

export const metadata: Metadata = {
  title: "정리 결과 확인",
};

export default function ReviewPage() {
  return (
    <PageBody narrow>
      <PageTitle title="정리 결과 확인" back={{ href: "/app/new", label: "공고 넣기" }} />
      <Card className="gap-6 px-4 md:px-6">
        <p className="rounded-xl bg-warning px-3.5 py-2.5 text-xs text-warning-foreground">
          노랑 칸은 페이지에서 읽지 못했거나 확인이 필요한 칸이에요. 고친 뒤 [저장]하면 내 계정에 저장돼요.
        </p>
        <ReviewForm />
      </Card>
    </PageBody>
  );
}
