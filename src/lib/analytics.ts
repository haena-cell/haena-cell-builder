// 이탈 분석 행동 기록 (D-75). Google 애널리틱스로 행동 이름과 방법·성공 여부만 보낸다.
// 공고 내용·회사명·직무·이메일·메모·사용자 id 는 절대 넣지 않는다.
// 측정 ID 가 없거나 이 컴퓨터에서만 열리는 확인용 주소(localhost)면 아무것도 보내지 않는다.

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

type Gtag = (...args: unknown[]) => void;
type GaWindow = Window & { dataLayer?: unknown[]; gtag?: Gtag };

export type TrackEvent =
  | "page_view"
  | "start_click" // 랜딩 [시작하기]·[둘러보기]
  | "login_start" // [Google로 시작하기] 누름
  | "login" // 로그인 끝 (기존 사용자)
  | "sign_up" // 로그인 끝 (처음 가입)
  | "posting_read" // 공고 정리(읽기) 끝 — 성공·실패
  | "posting_saved" // 공고 저장
  | "step_done" // 전형 단계 완료 체크
  | "todo_done"; // 준비 항목·할 일 체크

type Params = Record<string, string | number | boolean | undefined>;

let started = false;

function isLocal() {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host.endsWith(".localhost");
}

// 처음 부를 때 GA 설정을 먼저 넣는다(js → config → 행동 순서 보장). 스크립트가 늦게 와도 줄 서 있다가 보내진다
function ga(): Gtag | null {
  if (typeof window === "undefined" || !GA_ID || isLocal()) return null;
  const w = window as GaWindow;
  if (!started) {
    started = true;
    w.dataLayer = w.dataLayer || [];
    w.gtag =
      w.gtag ||
      function () {
        // gtag.js 는 arguments 객체 그대로 받아야 한다
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer!.push(arguments);
      };
    w.gtag("js", new Date());
    // 모든 기록의 주소를 공고 번호·쿼리 뺀 주소로 (GA 가 첫 화면에 자동으로 보내는 기록 포함)
    w.gtag("set", { page_location: window.location.origin + cleanPath(window.location.pathname) });
    w.gtag("config", GA_ID, {
      send_page_view: false,
      app_mode: window.matchMedia("(display-mode: standalone)").matches ? "installed" : "browser",
    });
  }
  return w.gtag ?? null;
}

export function track(event: TrackEvent, params: Params = {}) {
  ga()?.("event", event, params);
}

let firstView = true;

// 페이지 이동 기록. 이후 다른 행동 기록도 이 주소를 쓴다.
// 첫 화면은 GA 가 스스로 한 번 보내므로(측정 ID 의 Google 태그 설정) 두 번 세지 않게 건너뛴다
export function trackPageView(pathname: string) {
  const g = ga();
  if (!g) return;
  const path = cleanPath(pathname);
  const location = window.location.origin + path;
  g("set", { page_location: location, page_path: path });
  if (firstView) {
    firstView = false;
    return;
  }
  g("event", "page_view", { page_location: location, page_path: path, page_title: document.title });
}

// 페이지 주소에서 공고 번호 같은 id 를 빼고 보낸다: /app/postings/3f2a… → /app/postings/[id]
export function cleanPath(pathname: string) {
  return pathname
    .split("/")
    .map((part) => (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(part) || /^\d{3,}$/.test(part) ? "[id]" : part))
    .join("/");
}
