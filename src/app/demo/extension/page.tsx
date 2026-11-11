import type { Metadata } from "next";
import { ExtensionGuide } from "@/components/postings/extension-guide";
import { PageBody, PageTitle } from "@/components/postings/page-title";

export const metadata: Metadata = {
  title: "확장 프로그램",
};

export default function DemoExtensionPage() {
  return (
    <PageBody narrow>
      <PageTitle title="확장 프로그램" description="보던 공고 화면에서 바로 Hurdle에 담아요." />
      <ExtensionGuide />
    </PageBody>
  );
}
