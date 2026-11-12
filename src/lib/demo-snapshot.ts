import { cacheLife } from "next/cache";
import { demoPostings } from "@/lib/demo-postings";
import type { Posting } from "@/lib/postings";

// 둘러보기 예시 공고 + 기준 시각. 모두에게 같은 가상 자료라 몇 분씩 기억해 두고 메뉴를 바로 보여 준다 (D-64)
export async function getDemoSnapshot(): Promise<{ postings: Posting[]; nowIso: string }> {
  "use cache";
  cacheLife("minutes");
  const now = new Date();
  return { postings: demoPostings(now), nowIso: now.toISOString() };
}
