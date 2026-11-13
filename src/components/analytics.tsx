"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GA_ID, isTrackingOff, setTrackingOff, track, trackPageView } from "@/lib/analytics";

// Google 애널리틱스 (D-75). 측정 ID 는 공개해도 되는 값(NEXT_PUBLIC_GA_ID).
// 자동 페이지 기록은 끄고, 공고 번호·쿼리를 뺀 주소로 직접 보낸다.
// localhost·운영자 기기(D-77)에서는 GA 스크립트를 아예 불러오지 않는다
const LOGIN_COOKIE = "hurdle_login";

export function Analytics() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  // 처음 한 번: ?ga=off / ?ga=on 으로 이 기기 빼기·되돌리기, 그다음 불러올지 정한다
  useEffect(() => {
    const url = new URL(window.location.href);
    const flag = url.searchParams.get("ga");
    if (flag === "off" || flag === "on") {
      setTrackingOff(flag === "off");
      url.searchParams.delete("ga");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
      toast(flag === "off" ? "이 기기의 방문은 이제 통계에 넣지 않아요" : "이 기기의 방문을 다시 통계에 넣어요");
    }
    const off = isTrackingOff();
    if (off && GA_ID) (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 쿠키·주소는 화면을 그린 뒤에만 읽을 수 있다
    setAllowed(!off);
  }, []);

  useEffect(() => {
    trackPageView(pathname);
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

  if (!GA_ID || !allowed) return null;
  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />;
}

// 운영자 계정으로 로그인한 기기를 이탈 분석에서 뺀다 (D-77, OperatorNoTrack 이 서버에서 확인한 뒤 그린다)
export function MarkNoTrack() {
  useEffect(() => {
    if (!isTrackingOff()) setTrackingOff(true);
  }, []);
  return null;
}
