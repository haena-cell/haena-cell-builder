"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { cleanPath, GA_ID, track } from "@/lib/analytics";

// Google 애널리틱스 (D-75). 측정 ID 는 공개해도 되는 값(NEXT_PUBLIC_GA_ID).
// 자동 페이지 기록은 끄고, 공고 번호·쿼리를 뺀 주소로 직접 보낸다. localhost 에서는 보내지 않는다(lib/analytics)
const LOGIN_COOKIE = "hurdle_login";

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    const path = cleanPath(pathname);
    track("page_view", {
      page_path: path,
      page_location: window.location.origin + path,
      page_title: document.title,
    });
  }, [pathname]);

  // 로그인 직후 한 번: 로그인 처리(auth/callback)가 남긴 표시를 읽고 지운다
  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${LOGIN_COOKIE}=(login|sign_up)`));
    if (!match) return;
    document.cookie = `${LOGIN_COOKIE}=; Max-Age=0; Path=/`;
    track(match[1] as "login" | "sign_up", { method: "Google" });
  }, []);

  // data-track="행동이름" 이 붙은 버튼·링크를 누르면 기록 (랜딩 [시작하기]·[둘러보기] 등)
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-track]");
      if (!el) return;
      track(el.dataset.track as "start_click", { label: el.dataset.trackLabel });
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!GA_ID) return null;
  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />;
}
