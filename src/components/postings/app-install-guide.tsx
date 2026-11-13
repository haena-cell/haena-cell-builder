"use client";

import { Panel, Step, type Shot } from "@/components/postings/extension-guide";

// 메뉴의 [앱 설치] 안내 (D-81). 웹 앱 설치(D-60)를 단계마다 실제 화면 캡처로
// 캡처: 2026-11-12 사용자가 보낸 설치 과정. 이름·다른 프로그램·공고 내용은 가렸다. 파일은 public/app-install-guide/
const W = 1200;
const SHOTS = {
  button: { src: "/app-install-guide/button.png", width: W, height: 700, alt: "크롬 주소창 오른쪽의 설치 아이콘", need: "" },
  next: { src: "/app-install-guide/next.png", width: W, height: 700, alt: "앱 설치 창에서 다음 버튼", need: "" },
  install: { src: "/app-install-guide/install.png", width: W, height: 700, alt: "앱 설치 창에서 설치 버튼", need: "" },
  done: { src: "/app-install-guide/done.png", width: W, height: 700, alt: "설치되었습니다 창의 앱에서 웹 열기 버튼", need: "" },
  window: { src: "/app-install-guide/window.png", width: W, height: 749, alt: "주소창 없는 Hurdle 창과 Dock 의 주황 h 아이콘", need: "" },
  launchpad: { src: "/app-install-guide/launchpad.png", width: W, height: 749, alt: "Launchpad 에 생긴 Hurdle 아이콘", need: "" },
} satisfies Record<string, Shot>;

export function AppInstallGuide() {
  return (
    <div className="flex flex-col gap-4">
      <Panel title="이런 점이 좋아요">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
          <li>Dock이나 Launchpad의 주황 <b>h</b> 아이콘을 눌러 바로 열어요. 주소를 칠 필요가 없어요.</li>
          <li>주소창 없는 자기 창으로 열려서 다른 탭 사이에 섞이지 않아요.</li>
          <li>로그인과 저장한 공고는 크롬에서 쓰던 그대로예요. 새 버전도 자동으로 바뀌어서 다시 설치하지 않아도 돼요.</li>
        </ul>
      </Panel>

      <Panel title="설치하기 (크롬)" aside={<span className="text-xs text-muted-foreground">무료 · 약 30초</span>}>
        <ol className="flex flex-col gap-8">
          <Step n={1} shot={SHOTS.button}>
            <p>크롬에서 Hurdle을 연 채로, 주소창 오른쪽의 <b>설치</b> 아이콘을 눌러요. 안 보이면 크롬 오른쪽 위 ⋮ 메뉴에서 <b>Hurdle 설치</b>(또는 앱으로 설치)를 찾아 눌러요.</p>
          </Step>
          <Step n={2} shot={SHOTS.next}><p>앱 설치 창이 뜨면 <b>다음</b>을 눌러요.</p></Step>
          <Step n={3} shot={SHOTS.install}><p><b>설치</b>를 눌러요.</p></Step>
          <Step n={4} shot={SHOTS.done}><p>설치되었다고 나오면 <b>앱에서 웹 열기</b>를 눌러요.</p></Step>
          <Step n={5} shot={SHOTS.window}><p>주소창 없는 Hurdle 창이 열리면 끝이에요. Dock에도 주황 h 아이콘이 생겨요.</p></Step>
          <Step n={6} shot={SHOTS.launchpad}><p>다음부터는 Launchpad나 Dock에서 <b>Hurdle</b>을 눌러 열어요.</p></Step>
        </ol>
      </Panel>

      <Panel title="다른 브라우저 · 휴대폰">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
          <li><b>맥 사파리</b>: 메뉴 막대의 파일 → <b>Dock에 추가</b></li>
          <li><b>아이폰 사파리</b>: 아래 공유 버튼 → <b>홈 화면에 추가</b></li>
          <li><b>안드로이드 크롬</b>: 오른쪽 위 ⋮ → <b>홈 화면에 추가</b> 또는 <b>앱 설치</b></li>
        </ul>
      </Panel>

      <Panel title="지우고 싶으면">
        <p className="text-sm leading-relaxed">
          Hurdle 창 오른쪽 위 <b>제거</b>를 눌러요. 앱만 지워지고, 계정과 저장한 공고는 그대로 남아요.
        </p>
      </Panel>
    </div>
  );
}
