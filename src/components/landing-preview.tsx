import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DemoProvider } from "@/components/postings/demo-context";
import { HomeDashboard } from "@/components/postings/home-dashboard";
import { demoPostings } from "@/lib/demo-postings";
import { kstDateKey } from "@/lib/postings";

// 랜딩 첫 화면의 예시 홈 (D-36): 둘러보기와 같은 화면·예시 공고. 안쪽은 누를 수 없고 전체가 /demo 로 가는 링크다
async function PreviewHome() {
  await connection();
  const now = new Date();
  return (
    <DemoProvider>
      <HomeDashboard initialPostings={demoPostings(now)} today={kstDateKey(now)} />
    </DemoProvider>
  );
}

export function LandingPreview() {
  return (
    <div className="group relative h-[420px] overflow-hidden rounded-2xl bg-background ring-1 ring-border md:h-[560px]">
      <div inert className="p-3 md:p-5">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-card" />}>
          <PreviewHome />
        </Suspense>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-background to-transparent" />
      <Link
        href="/demo"
        aria-label="예시 화면 둘러보기"
        className="absolute inset-0 flex items-end justify-center pb-5 outline-none"
      >
        <span className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform group-hover:-translate-y-0.5">
          예시 화면 둘러보기
          <ArrowRight className="size-4" />
        </span>
      </Link>
    </div>
  );
}
