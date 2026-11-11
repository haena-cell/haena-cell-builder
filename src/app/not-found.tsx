import type { Metadata } from "next";
import Link from "next/link";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "찾는 화면이 없어요",
};

// 없는 주소·지운 공고 (QA 5번, D-54): 영어 기본 화면 대신 한국어 안내 + 갸우뚱 강아지
export default function NotFound() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-background px-3 py-16">
      <Card className="w-full max-w-sm items-center gap-6 px-6 py-10 text-center md:px-8 md:py-12">
        <Mascot pose="understand" size={128} hop />
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold tracking-tight">찾는 화면이 없어요</h1>
          <p className="text-sm text-muted-foreground">
            주소가 바뀌었거나 지운 공고일 수 있어요.
            <br />
            홈에서 다시 시작해 주세요.
          </p>
        </div>
        <Button size="lg" className="h-12 w-full text-base" asChild>
          <Link href="/app">홈으로</Link>
        </Button>
      </Card>
    </main>
  );
}
