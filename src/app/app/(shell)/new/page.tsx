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
          연습용 예시예요. 아직 실제로 공고를 읽지 않고 예시 결과를 보여 드려요. 인스타그램 링크를 넣으면 &lsquo;읽을 수 없음&rsquo; 안내를 볼 수 있어요.
        </p>
        <NewPostingForm />
      </Card>
    </PageBody>
  );
}
