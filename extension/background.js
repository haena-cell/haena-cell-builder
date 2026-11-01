// pacemate 크롬 확장 프로그램 (D-33)
// 아이콘을 누른 탭 하나만 읽는다(activeTab). 그 탭의 화면 글과 링크를 pacemate [공고 넣기] 탭에 건넨다.
// 글이 거의 없는 화면(이미지 공고)이면 보이는 화면을 한 장 캡처해 함께 건넨다.

// 결과를 넘길 pacemate 주소. 개발할 때는 "http://localhost:3000" 으로 바꾼다
const APP = "https://haena-cell-builder.vercel.app";
const MAX_TEXT = 20000;

function setBadge(tabId, text, color) {
  chrome.action.setBadgeText({ tabId, text });
  if (color) chrome.action.setBadgeBackgroundColor({ tabId, color });
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !/^https?:\/\//.test(tab.url || "")) {
    setBadge(tab.id, "!", "#D33A3A");
    return;
  }
  if (tab.url.startsWith(APP)) return; // pacemate 화면에서는 아무것도 하지 않는다

  try {
    setBadge(tab.id, "…", "#141414");
    // 화면에 보이는 글 (같은 탭의 프레임 포함 — 사람인 본문은 프레임 안에 있다)
    const readText = () => (document.body ? document.body.innerText : "");
    // 다른 사이트의 프레임(광고 등)은 읽을 수 없어 실패할 수 있다 → 그때는 위쪽 화면만 읽는다
    const frames = await chrome.scripting
      .executeScript({ target: { tabId: tab.id, allFrames: true }, func: readText })
      .catch(() => chrome.scripting.executeScript({ target: { tabId: tab.id }, func: readText }));
    const text = frames
      .map((f) => (typeof f.result === "string" ? f.result.trim() : ""))
      .filter(Boolean)
      .join("\n\n")
      .slice(0, MAX_TEXT);

    let image = null;
    if (text.length < 300) {
      image = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 80 });
    }

    const payload = { url: tab.url, text, image };
    const appTab = await chrome.tabs.create({ url: `${APP}/app/new?from=extension`, index: tab.index + 1 });

    // pacemate 탭이 열리면 그 탭에 공고를 건넨다 (그 탭의 sessionStorage + 신호)
    const deliver = async (tabId, info, updated) => {
      if (tabId !== appTab.id || info.status !== "complete") return;
      chrome.tabs.onUpdated.removeListener(deliver);
      if (!updated.url || !updated.url.startsWith(`${APP}/app/new`)) return; // 로그인 화면 등: 로그인 후 다시 누르기
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (data) => {
          sessionStorage.setItem("pacemate:incoming", JSON.stringify(data));
          window.dispatchEvent(new Event("pacemate:incoming"));
        },
        args: [payload],
      });
    };
    chrome.tabs.onUpdated.addListener(deliver);
    setBadge(tab.id, "");
  } catch (error) {
    console.error("pacemate: 공고를 담지 못했어요", error);
    setBadge(tab.id, "!", "#D33A3A");
  }
});
