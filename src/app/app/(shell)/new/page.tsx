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
        <p className="rounded-xl bg-info px-3.5 py-2.5 text-xs text-info-foreground">
          링크는 페이지에 적힌 채용 정보를 먼저 읽고, 빈 칸은 AI(Claude)가 채워요. 글·캡처도 AI가 정리해요. 공고 글 속 전화번호·이메일은 지우고 보내고, 원본은 저장하지 않아요.
        </p>
        <NewPostingForm />
      </Card>
    </PageBody>
  );
}
