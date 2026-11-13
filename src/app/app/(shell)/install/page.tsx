import type { Metadata } from "next";
import { AppInstallGuide } from "@/components/postings/app-install-guide";
import { PageBody, PageTitle } from "@/components/postings/page-title";

export const metadata: Metadata = {
  title: "앱 설치",
};

// 웹 앱 설치 안내 (D-81)
export default function InstallPage() {
  return (
    <PageBody narrow>
      <PageTitle title="앱 설치" />
      <AppInstallGuide />
    </PageBody>
  );
}
