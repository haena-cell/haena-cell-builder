import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { StandaloneTitle } from "@/components/standalone-title";
import { UndoShortcut } from "@/components/undo-shortcut";
import { Analytics } from "@/components/analytics";
import { Suspense } from "react";
import "./globals.css";

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-sans",
  weight: "45 920",
  display: "swap",
});

// 로고 글자 "hurdle" 전용 (D-56)
const outfit = Outfit({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Hurdle — 채용공고 링크 하나로 지원 현황까지 한곳에",
    template: "%s · Hurdle",
  },
  description: "여러 회사에 동시에 지원하는 취준생을 위한 공고 관리 서비스예요. 링크를 붙여넣으면 마감일과 전형 단계를 정리하고, 마감이 가까운 공고와 다음에 할 일을 한 화면에 보여 드려요.",
  applicationName: "Hurdle",
  // 사파리 [Dock에 추가]·아이폰 [홈 화면에 추가] 때 이름 (D-60)
  appleWebApp: { capable: true, title: "Hurdle", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <StandaloneTitle />
        <Suspense fallback={null}>
          <UndoShortcut />
        </Suspense>
        {/* 이탈 분석 (D-75) */}
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        <Toaster theme="light" mobileOffset={{ bottom: 88 }} />
      </body>
    </html>
  );
}
