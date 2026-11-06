import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-sans",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Pacemate — 채용공고 링크 하나로 지원 현황까지 한곳에",
    template: "%s · Pacemate",
  },
  description: "여러 회사에 동시에 지원하는 취준생을 위한 공고 관리 서비스예요. 링크를 붙여넣으면 마감일과 전형 단계를 정리하고, 마감이 가까운 공고와 다음에 할 일을 한 화면에 보여 드려요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster theme="light" mobileOffset={{ bottom: 88 }} />
      </body>
    </html>
  );
}
