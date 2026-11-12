"use client";

import { useEffect } from "react";

const SUFFIX = " · Hurdle";

// 설치한 앱 창(D-60)에서는 크롬이 제목 앞에 앱 이름 "Hurdle - " 을 붙인다.
// 그래서 앱 창일 때만 페이지 제목 끝의 " · Hurdle" 을 떼어 "Hurdle - 홈" 처럼 한 번만 보이게 한다.
export function StandaloneTitle() {
  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (!standalone) return;
    const trim = () => {
      if (document.title.endsWith(SUFFIX)) document.title = document.title.slice(0, -SUFFIX.length);
    };
    trim();
    // 화면을 옮길 때마다 Next.js 가 제목을 다시 쓰므로 바뀔 때마다 다시 뗀다
    const observer = new MutationObserver(trim);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
