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
        title="어떤 공고를 넣을까요?"
        description="채용 공고 링크를 붙여넣으면 기업·직무·마감일을 정리해 드려요."
        back={{ href: "/app", label: "홈" }}
      />
      <Card className="gap-6 px-4 md:px-6">
        <p className="rounded-xl bg-warning px-3.5 py-2.5 text-xs text-warning-foreground">
          채용 사이트 링크는 페이지에 적힌 채용 정보를 실제로 읽어요(AI 없이, 비용 없음). 글 붙여넣기·캡처는 아직 연습용 예시 결과를 보여 드려요.
        </p>
        <NewPostingForm />
      </Card>
    </PageBody>
  );
}
