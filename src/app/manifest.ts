import type { MetadataRoute } from "next";

// 웹 앱 설치 정보 (D-60): 크롬 [설치]·사파리 [Dock에 추가] 때 쓰는 이름·아이콘·시작 화면
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "Hurdle",
    short_name: "Hurdle",
    description: "채용공고 링크 하나로 지원 현황까지 한곳에",
    lang: "ko",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#F7F7F8",
    theme_color: "#FFFFFF",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
