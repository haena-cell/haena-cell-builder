// Pacemate 크롬 확장 팝업 (D-47)
// 아이콘을 누른 탭 하나만 읽어(activeTab) 서버에서 정리하고, 사용자가 확인한 뒤 저장한다.
// 로그인은 같은 크롬의 Pacemate 로그인을 그대로 쓴다. 비밀번호·키를 여기에 저장하지 않는다.

// 결과를 넘길 Pacemate 주소. 개발할 때는 "http://localhost:3000" 으로 바꾼다
const APP = "https://haena-cell-builder.vercel.app";
const MAX_TEXT = 20000;
const STAGES = [
  "회사명, 직무, 마감일을 읽고 있어요",
  "전형 절차를 확인하고 있어요",
  "제출 서류와 근무지를 찾고 있어요",
  "마지막으로 정리하고 있어요",
];
const STAGE_MS = 1800;

const $ = (id) => document.getElementById(id);
const VIEWS = ["loading", "notice", "form"];
let stageTimer = null;
let state = null; // { url, posting, unsure: [] }

function show(view) {
  clearInterval(stageTimer);
  for (const v of VIEWS) $(v).hidden = v !== view;
}

function showLoading() {
  show("loading");
  const list = $("stages");
  list.replaceChildren(
    ...STAGES.map((label) => {
      const li = document.createElement("li");
      const icon = document.createElement("span");
      icon.className = "icon";
      li.append(icon, label);
      return li;
    }),
  );
  let stage = 0;
  const paint = () => [...list.children].forEach((li, i) => (li.className = i < stage ? "done" : i === stage ? "now" : ""));
  paint();
  stageTimer = setInterval(() => {
    stage = Math.min(stage + 1, STAGES.length - 1);
    paint();
  }, STAGE_MS);
}

function showNotice(text, actionLabel, action) {
  show("notice");
  $("noticeText").textContent = text;
  $("noticeAction").hidden = !actionLabel;
  $("noticeAction").textContent = actionLabel ?? "";
  $("noticeAction").onclick = action ?? null;
}

const openApp = (path) => chrome.tabs.create({ url: `${APP}${path}` });
const showLogin = () => showNotice("Pacemate에 로그인하면 공고를 바로 저장할 수 있어요. 로그인한 뒤 공고 화면에서 아이콘을 다시 눌러 주세요.", "로그인하러 가기", () => openApp("/app/login"));
const showExisting = (id) => showNotice("이미 저장한 공고예요.", "저장한 공고 보기", () => openApp(`/app/postings/${id}`));

const draftKey = (url) => `draft:${url}`;
const keepDraft = () => state && chrome.storage.session.set({ [draftKey(state.url)]: { ...state, edits: readForm() } });

// 그 탭의 화면 글 (같은 탭의 프레임 포함). 다른 사이트 프레임 때문에 실패하면 위쪽 화면만
async function readPage(tab) {
  const readText = () => (document.body ? document.body.innerText : "");
  const frames = await chrome.scripting
    .executeScript({ target: { tabId: tab.id, allFrames: true }, func: readText })
    .catch(() => chrome.scripting.executeScript({ target: { tabId: tab.id }, func: readText }));
  const text = frames
    .map((f) => (typeof f.result === "string" ? f.result.trim() : ""))
    .filter(Boolean)
    .join("\n\n")
    .slice(0, MAX_TEXT);
  if (text.length >= 300) return { kind: "text", text };
  // 글이 거의 없으면(이미지 공고) 보이는 화면을 한 장 캡처한다
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 80 }).catch(() => null);
  if (dataUrl) return { kind: "image", dataUrl };
  return text.length >= 20 ? { kind: "text", text } : null;
}

async function start(tab) {
  showLoading();
  try {
    const check = await fetch(`${APP}/api/extension/check?url=${encodeURIComponent(tab.url)}`, { credentials: "include" });
    if (check.status === 401) return showLogin();
    if (!check.ok) throw new Error("check");
    const { existing } = await check.json();
    if (existing) return showExisting(existing.id);

    const input = await readPage(tab);
    if (!input) return showNotice("이 화면에서 공고 글을 읽지 못했어요. 공고 내용이 보이는 화면에서 다시 눌러 주세요.");

    const res = await fetch(`${APP}/api/extract`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.status === 401) return showLogin();
    const data = await res.json();
    if (!res.ok || data.status !== "ok") {
      return showNotice(data.error ?? data.message ?? "공고를 정리하지 못했어요.", "다시 시도", () => start(tab));
    }
    state = { url: tab.url, posting: data.posting, unsure: [...(data.posting.unsure ?? [])] };
    fillForm(formFromPosting(data.posting));
    keepDraft();
  } catch {
    showNotice("Pacemate에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.", "다시 시도", () => start(tab));
  }
}

const kstDate = (iso) => (iso ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date(iso)) : "");

function formFromPosting(p) {
  return {
    company: p.company ?? "",
    jobTitle: p.jobTitle ?? "",
    kind: p.deadlineKind ?? "date",
    date: kstDate(p.deadlineAt),
    location: p.location ?? "",
    employmentType: p.employmentType ?? "",
    requiredDocs: (p.requiredDocs ?? []).join(", "),
    steps: (p.steps ?? []).join("\n"),
  };
}

function readForm() {
  return {
    company: $("company").value,
    jobTitle: $("jobTitle").value,
    kind: document.querySelector("input[name=kind]:checked")?.value ?? "date",
    date: $("date").value,
    location: $("location").value,
    employmentType: $("employmentType").value,
    requiredDocs: $("requiredDocs").value,
    steps: $("steps").value,
  };
}

function paintUnsure() {
  for (const el of document.querySelectorAll("[data-key]")) el.classList.toggle("unsure", state.unsure.includes(el.dataset.key));
  const hidden = ["location", "employmentType", "requiredDocs", "steps"].filter((k) => state.unsure.includes(k)).length;
  $("moreCount").textContent = hidden ? `· 확인할 칸 ${hidden}개` : "";
}

function touch(key) {
  state.unsure = state.unsure.filter((k) => k !== key);
  paintUnsure();
  keepDraft();
}

function paintJobOptions() {
  const options = state.posting.jobOptions ?? [];
  $("jobOptionsBox").hidden = options.length < 2;
  $("jobOptions").replaceChildren(
    ...options.map((name) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String($("jobTitle").value === name));
      b.textContent = name;
      b.onclick = () => {
        $("jobTitle").value = name;
        touch("jobTitle");
        paintJobOptions();
      };
      return b;
    }),
  );
}

function fillForm(values) {
  show("form");
  $("link").href = state.url;
  $("link").textContent = state.url;
  $("company").value = values.company;
  $("jobTitle").value = values.jobTitle;
  document.querySelector(`input[name=kind][value=${values.kind}]`).checked = true;
  $("date").value = values.date;
  $("location").value = values.location;
  $("employmentType").value = values.employmentType;
  $("requiredDocs").value = values.requiredDocs;
  $("steps").value = values.steps;
  // 여러 직무 공고는 고를 때까지 확인 칸으로 둔다 (D-43)
  if ((state.posting.jobOptions ?? []).length >= 2 && !state.jobChosen && !state.unsure.includes("jobTitle")) state.unsure.push("jobTitle");
  paintDate();
  paintJobOptions();
  paintUnsure();
}

function paintDate() {
  $("date").hidden = readForm().kind !== "date";
}

function formError(message) {
  $("formError").hidden = !message;
  $("formError").textContent = message ?? "";
}

async function save(event) {
  event.preventDefault();
  const f = readForm();
  if (!f.company.trim() || !f.jobTitle.trim()) return formError("기업명과 직무를 채워 주세요.");
  if (f.kind === "date" && !f.date) return formError("마감 날짜를 골라 주세요.");
  const steps = f.steps.split("\n").map((s) => s.trim()).filter(Boolean);
  if (steps.length === 0) {
    $("more").open = true;
    return formError("전형 절차를 한 단계 이상 넣어 주세요.");
  }
  formError(null);
  $("save").disabled = true;
  $("save").textContent = "저장하는 중…";

  // 읽은 날짜 그대로면 읽은 시각을 유지하고, 날짜를 고쳤으면 그날 23:59 (한국 시간)
  const p = state.posting;
  const sameDay = f.kind === "date" && kstDate(p.deadlineAt) === f.date && p.deadlineAt;
  const { jobOptions: _unused, ...aiRaw } = p; // 직무 후보는 저장하지 않는다 (D-43)
  try {
    const res = await fetch(`${APP}/api/extension/save`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: f.company,
        jobTitle: f.jobTitle,
        deadlineKind: f.kind,
        deadlineAt: f.kind === "date" ? (sameDay ? p.deadlineAt : new Date(`${f.date}T23:59:00+09:00`).toISOString()) : null,
        deadlineTimeKnown: f.kind === "date" && sameDay ? p.deadlineTimeKnown === true : false,
        location: f.location,
        employmentType: f.employmentType,
        companySize: p.companySize ?? null,
        requiredDocs: f.requiredDocs.split(",").map((s) => s.trim()).filter(Boolean),
        steps,
        sourceUrl: state.url,
        aiRaw,
      }),
    });
    if (res.status === 401) return showLogin();
    const result = await res.json();
    if (result.ok) {
      await chrome.storage.session.remove(draftKey(state.url));
      const saved = f.company.trim();
      state = null;
      return showNotice(`${saved} 공고를 저장했어요.`, "Pacemate에서 보기", () => openApp(`/app/postings/${result.id}`));
    }
    if (result.existingId) {
      await chrome.storage.session.remove(draftKey(state.url));
      return showExisting(result.existingId);
    }
    formError(result.message ?? "저장하지 못했어요. 다시 시도해 주세요.");
  } catch {
    formError("인터넷 연결을 확인하고 다시 시도해 주세요.");
  }
  $("save").disabled = false;
  $("save").textContent = "저장";
}

function bindForm() {
  $("form").addEventListener("submit", save);
  for (const key of ["company", "jobTitle", "location", "employmentType", "requiredDocs", "steps"]) {
    $(key).addEventListener("input", () => {
      if (key === "jobTitle") {
        state.jobChosen = true;
        paintJobOptions();
      }
      touch(key);
    });
  }
  $("date").addEventListener("input", () => touch("deadline"));
  for (const radio of document.querySelectorAll("input[name=kind]")) {
    radio.addEventListener("change", () => {
      paintDate();
      touch("deadline");
    });
  }
}

async function init() {
  bindForm();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !/^https?:\/\//.test(tab.url)) return showNotice("채용 공고 화면에서 아이콘을 눌러 주세요.");
  if (tab.url.startsWith(APP)) return showNotice("채용 공고 화면에서 아이콘을 눌러 주세요. 이 화면은 Pacemate예요.");

  // 팝업은 다른 곳을 누르면 닫힌다 → 정리 결과와 고친 내용은 다시 열었을 때 이어서 (AI 를 또 부르지 않는다)
  const saved = await chrome.storage.session.get(draftKey(tab.url));
  const draft = saved[draftKey(tab.url)];
  if (draft) {
    state = { url: draft.url, posting: draft.posting, unsure: draft.unsure, jobChosen: draft.jobChosen };
    return fillForm(draft.edits);
  }
  start(tab);
}

init();
