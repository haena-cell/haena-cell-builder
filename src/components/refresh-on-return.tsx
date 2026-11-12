"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const MIN_GAP_MS = 30_000;

// 다른 창·탭(확장 프로그램, 맥 앱, 다른 기기)에서 공고를 바꿨을 수 있으니,
// 이 창으로 돌아오면 기억해 둔 화면을 비우고 지금 화면을 새로 불러온다 (D-64). 너무 잦지 않게 30초 간격
export function RefreshOnReturn() {
  const router = useRouter();
  useEffect(() => {
    let last = Date.now();
    // 탭을 바꿨다 돌아오면 visibilitychange, 다른 창(크롬 ↔ 설치한 앱 창)에서 돌아오면 focus
    function onVisible() {
      if (document.visibilityState !== "visible" || Date.now() - last < MIN_GAP_MS) return;
      last = Date.now();
      router.refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [router]);
  return null;
}
