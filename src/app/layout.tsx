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
  title: "과정노트 — 작업하며 남긴 메모가 케이스 스터디가 돼요",
  description: "포트폴리오를 준비하는 디자인 학습자를 위한 AI 기록장이에요. 작업 중에 한 줄씩만 남기면, 끝났을 때 과정이 담긴 케이스 스터디 초안을 만들어 드려요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster theme="light" />
      </body>
    </html>
  );
}
