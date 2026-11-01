import type { Metadata } from "next";
import { PageBody, PageTitle } from "@/components/postings/page-title";
import { ReviewForm } from "@/components/postings/review-form";

export const metadata: Metadata = {
  title: "정리 결과 확인",
};

export default function ReviewPage() {
  return (
    <PageBody>
      <PageTitle
        title="정리 결과 확인"
        description="노란 칸만 확인하고 고친 뒤 저장해요."
        back={{ href: "/app/new", label: "공고 넣기" }}
      />
      <ReviewForm />
    </PageBody>
  );
}
