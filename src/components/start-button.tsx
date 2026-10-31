import Link from "next/link";
import { Button } from "@/components/ui/button";

// 랜딩 [시작하기]: /app 으로 간다. 로그인 안 했으면 proxy 가 로그인 화면으로 보내고, 했으면 바로 목록이 열린다 (D-06).
export function StartButton({ className }: { className?: string }) {
  return (
    <Button size="lg" className={className} asChild>
      <Link href="/app">시작하기</Link>
    </Button>
  );
}
