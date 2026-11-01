import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { PageBody, PageTitle } from "@/components/postings/page-title";
import { NewPostingForm } from "@/components/postings/new-posting-form";

export const metadata: Metadata = {
  title: "공고 넣기",
};

export default function NewPostingPage() {
  return (
    <PageBody narrow>
      <PageTitle
        title="공고 넣기"
        description="링크·글·캡처 중 편한 방법으로 넣으면 정리해 드려요."
        back={{ href: "/app", label: "홈" }}
      />
      <Card className="gap-6 px-4 md:px-8 md:py-8">
        <NewPostingForm />
      </Card>
    </PageBody>
  );
}
