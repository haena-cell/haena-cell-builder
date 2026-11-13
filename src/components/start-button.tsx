import Link from "next/link";
import { Button } from "@/components/ui/button";

// 랜딩 [시작하기]: /app 으로 간다. 로그인 안 했으면 proxy 가 로그인 화면으로 보내고, 했으면 바로 목록이 열린다 (D-06).
export function StartButton({ className }: { className?: string }) {
  return (
    <Button size="lg" className={className} asChild>
      <Link href="/app" data-track="start_click" data-track-label="start">
        시작하기
      </Link>
    </Button>
  );
}

// 로그인 없이 예시 공고로 둘러보기 (D-34)
export function DemoButton({ className }: { className?: string }) {
  return (
    <Button variant="outline" size="lg" className={className} asChild>
      <Link href="/demo" data-track="start_click" data-track-label="demo">
        로그인 없이 둘러보기
      </Link>
    </Button>
  );
}
