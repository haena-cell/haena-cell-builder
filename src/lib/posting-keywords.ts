// 공고 본문의 "항목 : 값" 줄을 키워드로 읽기 (D-23, AI 없음).
// 예) "고용형태 : 정규직" · "근무지 : 서울 금천구 …" · "전형절차 : 서류전형 → 1차면접 → 최종합격" · "제출서류 : 이력서, 포트폴리오"
// 링크 본문(T-15)과 글 붙여넣기(T-06)에 같이 쓴다.

export type KeywordFields = {
  employmentType: string | null;
  location: string | null;
  steps: string[];
  requiredDocs: string[];
  deadlineDate: string | null; // YYYY-MM-DD (한국 날짜)
};

const LABELS = {
  employmentType: /^(고용\s*형태|근무\s*형태|근로\s*형태|채용\s*형태|고용\s*구분)/,
  location: /^(근무\s*지역|근무\s*지|근무\s*장소|근무\s*위치|근무처)/,
  steps: /^(전형\s*절차|채용\s*절차|전형\s*과정|채용\s*과정|전형\s*방법|선발\s*절차)/,
  requiredDocs: /^(제출\s*서류|필수\s*서류|지원\s*서류|구비\s*서류)/,
  deadline: /^(접수\s*기간|모집\s*기간|지원\s*기간|마감\s*일|마감\s*일시|접수\s*마감|서류\s*마감)/,
};
type Key = keyof typeof LABELS;

const EMPLOYMENT_WORDS = ["정규직", "계약직", "인턴", "파견직", "파견", "프리랜서", "아르바이트", "위촉직", "전환형 인턴"];
const DOC_WORDS = [
  "이력서", "자기소개서", "포트폴리오", "경력기술서", "경력증명서", "졸업증명서", "성적증명서",
  "자격증", "어학성적", "주민등록등본", "건강진단서", "추천서", "과제",
];

const decodeEntities = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

const cellText = (html: string) =>
  decodeEntities(html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const isLabel = (text: string) => text.length <= 12 && Object.values(LABELS).some((re) => re.test(text));

// 표를 "항목 : 값" 줄로. 가로 표(맨 윗줄이 항목 이름, 다음 줄이 값)와 세로 표(왼쪽 칸이 항목 이름) 둘 다
function tableLines(html: string) {
  const lines: string[] = [];
  for (const [, table] of html.matchAll(/<table[\s\S]*?>([\s\S]*?)<\/table>/gi)) {
    const rows = [...table.matchAll(/<tr[\s\S]*?>([\s\S]*?)<\/tr>/gi)].map(([, row]) =>
      [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(([, cell]) => cellText(cell)),
    );
    rows.forEach((cells, r) => {
      if (cells.length === 2 && isLabel(cells[0]) && cells[1]) lines.push(`${cells[0]} : ${cells[1]}`);
      const next = rows[r + 1];
      if (cells.length >= 2 && next?.length === cells.length && cells.some(isLabel)) {
        cells.forEach((cell, i) => {
          if (isLabel(cell) && next[i] && !isLabel(next[i])) lines.push(`${cell} : ${next[i]}`);
        });
      }
    });
  }
  return lines;
}

// HTML → 줄 단위 글. 표에서 뽑은 "항목 : 값" 줄을 앞에 둔다. 표의 제목 칸(th·dt) 뒤에는 ":" 를 붙인다
export function htmlToLines(html: string) {
  const body = decodeEntities(
    html
      .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/(th|dt)>/gi, " : ")
      .replace(/<br\s*\/?>|<\/(p|div|li|tr|dd|h\d|section|table|ul|ol)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[•·∙◦▪■□○●►▶▷◆◇※✔✓]\s|ㆍ/g, "\n")
    .replace(/[ \t\u00a0]+/g, " ");
  return [...tableLines(html), ...body.split("\n")]
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
}

// 한 줄에 다음 항목이 이어 붙어 있으면 거기서 자른다 ("이력서 및 자기소개서 접수방법/기간 …")
const NEXT_SECTION = /\s(접수\s*방법|접수\s*기간|문의|기타\s*사항|유의\s*사항|우대\s*사항|자격\s*요건|근무\s*조건|복리\s*후생|급여|모집\s*인원|전형\s*절차|제출\s*서류|근무\s*지|근무\s*형태|고용\s*형태)/;
const cutAtNextSection = (value: string) => {
  const m = NEXT_SECTION.exec(value);
  return (m ? value.slice(0, m.index) : value).trim();
};

// 줄 앞의 이모지·기호·번호 떼기
const stripLead = (line: string) => line.replace(/^[^\p{L}\p{N}]+/u, "").replace(/^\d+\.\s*/, "");

function findLabelValue(lines: string[], key: Key) {
  for (let i = 0; i < lines.length; i++) {
    const line = stripLead(lines[i]);
    const m = LABELS[key].exec(line);
    // "근무지는 …" 처럼 항목 이름 뒤에 글자가 바로 붙으면 항목이 아니라 문장이다
    if (!m || /^[가-힣]/.test(line.slice(m[0].length))) continue;
    const rest = line.slice(m[0].length).replace(/^\s*(및\s*방법)?\s*[:：\-]?\s*/, "").trim();
    if (rest) return cutAtNextSection(rest);
    // 전형 절차·제출 서류만: 항목 이름 한 줄 뒤에 여러 줄로 이어지는 경우, 다음 항목이 나오기 전 6줄까지
    if (key !== "steps" && key !== "requiredDocs") continue;
    const following: string[] = [];
    for (const next of lines.slice(i + 1, i + 7)) {
      const n = stripLead(next);
      if (!n || Object.values(LABELS).some((re) => re.test(n)) || /[:：]/.test(n)) break;
      following.push(n);
    }
    if (following.length) return cutAtNextSection(following.join(" → "));
  }
  return null;
}

function employmentFrom(value: string) {
  // 괄호 안 설명("3개월 후 정규직 전환 검토")은 고용 형태가 아니다
  const main = value.replace(/\([^)]*\)/g, " ");
  const found = EMPLOYMENT_WORDS.filter((w) => main.includes(w));
  const unique = found.filter((w) => !found.some((o) => o !== w && o.includes(w)));
  return unique.length ? unique.map((w) => (w === "파견직" ? "파견" : w)).join(", ") : null;
}

function soleEmployment(text: string) {
  const found = employmentFrom(text);
  return found && !found.includes(",") ? found : null;
}

function stepsFrom(value: string) {
  const parts = value
    .split(/\s*(?:→|->|⇒|➡|▶|▷|〉|›|>|＞|\s-\s|,|\/|\d+\s*[.)]\s)\s*/)
    .map((s) => s.replace(/^\d+\s*[.)]\s*/, "").replace(/[()]/g, " ").replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 0 && s.length <= 20);
  return parts.length >= 2 ? [...new Set(parts)].slice(0, 8) : [];
}

function docsFrom(value: string) {
  const items = value.split(/\s*(?:,|\/|·|、|및|\+)\s*/).map((s) => s.trim()).filter(Boolean);
  const docs = items.map((item) => DOC_WORDS.find((w) => item.includes(w)) ?? (item.length <= 15 ? item : null));
  return [...new Set(docs.filter((d): d is string => !!d))].slice(0, 8);
}

// 기간이면 뒤 날짜(마감), 날짜가 하나면 그 날짜
function deadlineFrom(value: string) {
  const dates = [...value.matchAll(/(\d{4})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/g)];
  const last = dates.at(-1);
  if (!last) return null;
  const [, y, m, d] = last;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function readKeywordFields(text: string): KeywordFields {
  const lines = text.split("\n");
  const value = (key: Key) => findLabelValue(lines, key);
  const employment = value("employmentType");
  const location = value("location");
  const steps = value("steps");
  const docs = value("requiredDocs");
  const deadline = value("deadline");
  return {
    // 항목 이름이 없으면 본문 앞부분에 고용 형태 낱말이 딱 하나 있을 때만 쓴다
    employmentType: employment ? employmentFrom(employment) : soleEmployment(text.slice(0, 2000)),
    location: location ? location.replace(/\s*(지도\s*보기|길찾기).*$/, "").slice(0, 60).trim() || null : null,
    steps: steps ? stepsFrom(steps) : [],
    requiredDocs: docs ? docsFrom(docs) : [],
    deadlineDate: deadline ? deadlineFrom(deadline) : null,
  };
}
