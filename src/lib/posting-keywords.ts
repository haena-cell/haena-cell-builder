// 공고 본문의 "항목 : 값" 줄을 키워드로 읽기 (D-23, AI 없음).
// 예) "고용형태 : 정규직" · "근무지 : 서울 금천구 …" · "전형절차 : 서류전형 → 1차면접 → 최종합격" · "제출서류 : 이력서, 포트폴리오"
// 링크 본문(T-15)과 글 붙여넣기(T-06)에 같이 쓴다.

export type KeywordFields = {
  company: string | null;
  jobTitle: string | null;
  employmentType: string | null;
  location: string | null;
  steps: string[];
  requiredDocs: string[];
  deadlineKind: "date" | "rolling" | "until_filled" | null;
  deadlineDate: string | null; // YYYY-MM-DD (한국 날짜)
  deadlineTime: string | null; // HH:MM, 공고에 시각이 있을 때만 (23:59·24시는 날짜만 아는 것으로)
  guessed: ("company" | "jobTitle")[]; // 항목 이름 없이 첫 줄·문장에서 짐작한 칸
};

const LABELS = {
  company: /^(회사\s*명|기업\s*명|회사|기업|company)/i,
  jobTitle: /^(모집\s*직무|채용\s*직무|모집\s*부문|모집\s*분야|채용\s*분야|직무|포지션|job\s*title|position)/i,
  employmentType: /^(고용\s*형태|고용\s*유형|고용\s*구분|근무\s*형태|근로\s*형태|채용\s*형태|계약\s*형태|employment(\s*type)?)/i,
  location: /^(근무\s*지역|근무\s*지|근무\s*장소|근무\s*위치|근무처|location)/i,
  steps: /^(전형\s*절차|채용\s*절차|전형\s*과정|채용\s*과정|채용\s*프로세스|전형\s*방법|선발\s*절차|hiring\s*process)/i,
  requiredDocs: /^(제출\s*서류|제출\s*자료|필수\s*서류|필요\s*서류|지원\s*서류|구비\s*서류|제출)/,
  deadline: /^(접수\s*마감일?|지원\s*마감일?|서류\s*마감일?|마감\s*일시|마감\s*기한|마감\s*일|마감|deadline)/i,
  period: /^(접수\s*기간|모집\s*기간|지원\s*기간|서류\s*접수)/,
  address: /^(회사\s*주소|사무실\s*주소|주소)/,
};
type Key = keyof typeof LABELS;

// 흔한 낱말이라 구분 기호(: | -)나 다음 줄 값이 있을 때만 항목으로 본다
const WEAK_LABEL = /^(회사|기업|직무|제출|마감)$/;
// 이모지가 항목 이름을 대신하는 줄 (인스타그램 글 등)
const EMOJI_LABELS: [RegExp, Key][] = [
  [/^\s*(🏢|🏬)/u, "company"],
  [/^\s*(💼|🧑‍💻|👩‍💻)/u, "jobTitle"],
  [/^\s*(📍|🗺)/u, "location"],
  [/^\s*(⏰|📅|🗓|⏳)/u, "deadline"],
];

const EMPLOYMENT_WORDS = ["정규직", "계약직", "인턴", "파견직", "파견", "프리랜서", "아르바이트", "파트타임", "위촉직", "전환형 인턴"];
const EMPLOYMENT_ENGLISH: [RegExp, string][] = [
  [/full[\s-]*time/i, "정규직"],
  [/part[\s-]*time/i, "아르바이트"],
  [/contract/i, "계약직"],
  [/intern/i, "인턴"],
  [/freelanc/i, "프리랜서"],
];
const DOC_WORDS = [
  "입사지원서", "이력서", "자기소개서", "포트폴리오", "경력기술서", "경력증명서", "졸업증명서", "성적증명서",
  "자격증", "어학성적", "증빙서류", "주민등록등본", "건강진단서", "추천서", "과제",
];
const REGION = /^(서울|경기|인천|부산|대구|대전|광주|울산|세종|강원|충북|충남|전북|전남|경북|경남|제주|충청|전라|경상)/;
const STEP_WORD = /서류|면접|인터뷰|과제|합격|최종|인적성|코딩|실기|resume|interview|offer|test/i;
// 첫 줄에서 회사 이름으로 볼 수 없는 낱말
const GENERIC_WORD = /^(서비스|브랜드|콘텐츠|마케팅|사업|데이터|프로덕트|그로스|퍼포먼스|신입|경력|채용|공고|모집|인턴|정규직|계약직|\d)/;

const BULLETS = /[•·∙◦▪■□○●►◆◇※✔✓]\s|ㆍ/g;

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
    .replace(BULLETS, "\n")
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

// 줄 앞의 이모지·기호·번호 떼기, "[근무지] 서울" 의 괄호 풀기
const stripLead = (line: string) =>
  line
    .replace(/^[^\p{L}\p{N}[<【〈]+/u, "")
    .replace(/^[①-⑳]\s*/, "")
    .replace(/^[[<【〈]\s*([^\]>】〉]{1,12}?)\s*[\]>】〉]\s*/, "$1 : ")
    .replace(/^\d+[.)]\s*/, "");

const isLabelLine = (line: string) => Object.values(LABELS).some((re) => re.test(stripLead(line)));

// 줄에서 항목 값 찾기. 값이 맞는지(accept) 볼 수 있어서, 맞지 않으면 다음 같은 항목을 본다
function findLabelValue(lines: string[], key: Key, accept: (value: string) => boolean = () => true) {
  for (let i = 0; i < lines.length; i++) {
    const line = stripLead(lines[i]);
    const m = LABELS[key].exec(line);
    if (!m) continue;
    const after = line.slice(m[0].length);
    // "근무지는 …" 처럼 항목 이름 뒤에 글자가 바로 붙으면 항목이 아니라 문장이다
    if (/^[가-힣a-z]/i.test(after)) continue;
    const separated = /^\s*(및\s*방법\s*)?[:：|\-–]/.test(after) || /^\t/.test(after);
    const rest = after.replace(/^\s*(및\s*방법)?\s*[:：|\-–]?\s*/, "").trim();
    // "제출서류 : 온라인 이력서," 처럼 쉼표로 끝나면 다음 줄로 이어진다
    const continues = rest && key === "requiredDocs" && /[,、]$/.test(rest);
    if (rest && !continues) {
      if (WEAK_LABEL.test(m[0]) && !separated && !/^[\d~]/.test(rest)) continue;
      const value = cutAtNextSection(rest);
      if (value && accept(value)) return value;
      continue;
    }
    // 항목 이름 한 줄 뒤에 값이 오는 경우. 전형 절차·제출 서류는 여러 줄, 나머지는 한 줄
    const count = key === "steps" ? 10 : key === "requiredDocs" ? 6 : 1;
    const following: string[] = rest ? [rest] : [];
    for (const next of lines.slice(i + 1, i + 1 + count)) {
      const n = stripLead(next);
      // 지역 값은 "서울 : 성동구" 처럼 쌍점이 있어도 받는다
      const regionValue = key === "location" && REGION.test(n);
      if (!n || isLabelLine(next) || (/[:：]/.test(n) && !regionValue) || n.length > 80) break;
      if (key === "requiredDocs" && /합격/.test(n)) continue; // "최종 합격 후 제출" 서류는 지원 때 내는 서류가 아니다
      following.push(n);
    }
    if (following.length) {
      const value = cutAtNextSection(following.join(" → "));
      if (value && accept(value)) return value;
    }
  }
  return null;
}

function emojiValue(lines: string[], key: Key) {
  const emoji = EMOJI_LABELS.filter(([, k]) => k === key).map(([re]) => re);
  for (const line of lines) {
    if (emoji.some((re) => re.test(line))) return stripLead(line).replace(/^[^:：]{0,6}[:：]\s*/, "").trim() || null;
  }
  return null;
}

function employmentFrom(value: string) {
  // 괄호 안 설명("3개월 후 정규직 전환 검토")과 "정규직 전환"은 고용 형태가 아니다
  const main = value.replace(/\([^)]*\)/g, " ").replace(/정규직\s*전환/g, " ").replace(/파견\s*계약직/g, "파견");
  const found = EMPLOYMENT_WORDS.filter((w) => main.includes(w));
  const unique = found.filter((w) => !found.some((o) => o !== w && o.includes(w)));
  if (unique.length) return unique.map((w) => (w === "파견직" ? "파견" : w)).join(", ");
  return EMPLOYMENT_ENGLISH.find(([re]) => re.test(main))?.[1] ?? null;
}

// 괄호 안까지 세어 낱말이 딱 하나일 때만 (공채처럼 직무마다 다르면 비워 둔다)
function soleEmployment(text: string) {
  const raw = text.replace(/[a-z-]+/gi, " ").replace(/\(/g, " ").replace(/\)/g, " ");
  const found = employmentFrom(raw);
  return found && !found.includes(",") ? found : null;
}

function stepsFrom(value: string) {
  const parts = value
    .replace(/\uFE0F/g, "")
    .split(/\s*(?:→|->|⇒|➡|▶|▷|〉|›|>|＞|\s-\s|,|\/|\d+\s*[.)]\s)\s*/)
    .map((s) => s.replace(/^\d+\s*[.)]\s*/, "").replace(/[()]/g, " ").replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 0 && s.length <= 20 && !/지원\s*방법|접수\s*방법|유의\s*사항|문의|^step\s*\d+$/i.test(s));
  // 단계 같은 낱말이 절반은 있어야 전형 절차로 본다 (직무 분류표 등을 잘못 읽지 않게)
  const stepLike = parts.filter((s) => STEP_WORD.test(s)).length;
  return parts.length >= 2 && stepLike * 2 >= parts.length ? [...new Set(parts)].slice(0, 8) : [];
}

function docsFrom(value: string) {
  const items = value
    .replace(/포토폴리오/g, "포트폴리오")
    .split(/\s*(?:,|\/|·|、|및|\+|→|\s와\s)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  // 목록에 없는 서류 이름은 짧고 설명이 아닐 때만 ("희망연봉 필수 기재" 같은 안내는 뺀다)
  const docs = items.map((item) => DOC_WORDS.find((w) => item.includes(w)) ?? (item.length <= 15 && !/기재|필수|작성|선택|제출/.test(item) ? item : null));
  return [...new Set(docs.filter((d): d is string => !!d))].slice(0, 8);
}

const pad = (n: string | number) => String(n).padStart(2, "0");

// 글에서 날짜 찾기: 기간이면 뒤 날짜(마감). 연도가 없으면 올해, 한 달 넘게 지났으면 내년으로 본다
function dateFrom(value: string, now: Date, allowShort: boolean) {
  const full = [...value.matchAll(/(\d{4})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/g)].at(-1);
  if (full) return { date: `${full[1]}-${pad(full[2])}-${pad(full[3])}`, end: (full.index ?? 0) + full[0].length };
  const short =
    [...value.matchAll(/(\d{1,2})\s*월\s*(\d{1,2})\s*일?/g)].at(-1) ??
    (allowShort ? [...value.matchAll(/(?<![\d.:/-])(\d{1,2})[./](\d{1,2})(?![\d:])/g)].at(-1) : undefined);
  if (!short) return null;
  const month = Number(short[1]);
  const day = Number(short[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const thisYear = now.getFullYear();
  const candidate = Date.UTC(thisYear, month - 1, day);
  const year = candidate < now.getTime() - 31 * 24 * 60 * 60 * 1000 ? thisYear + 1 : thisYear;
  return { date: `${year}-${pad(month)}-${pad(day)}`, end: (short.index ?? 0) + short[0].length };
}

function timeFrom(after: string) {
  const clock = /(오전|오후)?\s*(\d{1,2})\s*(?::\s*(\d{2})|시(?:\s*(\d{1,2})\s*분)?)/.exec(after);
  if (!clock) return null;
  let hour = Number(clock[2]);
  if (clock[1] === "오후" && hour < 12) hour += 12;
  const minute = Number(clock[3] ?? clock[4] ?? 0);
  if (hour > 24 || minute > 59) return null;
  if (hour === 24 || (hour === 23 && minute === 59)) return null;
  return `${pad(hour)}:${pad(minute)}`;
}

type Deadline = Pick<KeywordFields, "deadlineKind" | "deadlineDate" | "deadlineTime">;
const NO_DEADLINE: Deadline = { deadlineKind: null, deadlineDate: null, deadlineTime: null };

function deadlineFrom(raw: string, now: Date, allowShort = true): Deadline | null {
  // "2026-11-06 08시 ~ 채용시": 기간이면 물결 뒤가 마감이다. 앞 날짜는 시작일
  const value = raw.includes("~") ? raw.slice(raw.lastIndexOf("~") + 1) : raw;
  const found = dateFrom(value, now, allowShort);
  if (found) return { deadlineKind: "date", deadlineDate: found.date, deadlineTime: timeFrom(value.slice(found.end)) };
  if (/상시/.test(value)) return { deadlineKind: "rolling", deadlineDate: null, deadlineTime: null };
  if (/채용\s*시|충원\s*시/.test(value)) return { deadlineKind: "until_filled", deadlineDate: null, deadlineTime: null };
  return null;
}

function readDeadline(lines: string[], text: string, now: Date): Deadline {
  const valid = (value: string) => deadlineFrom(value, now) !== null;
  // 마감 항목 → 기간 항목 → 이모지 줄 → "~11/28", "12월 3일까지" 같은 문장 → 상시·채용 시 마감
  const labeled = findLabelValue(lines, "deadline", valid) ?? findLabelValue(lines, "period", valid) ?? emojiValue(lines, "deadline");
  const fromLabel = labeled ? deadlineFrom(labeled, now) : null;
  if (fromLabel) return fromLabel;
  for (const line of lines) {
    if (/까지|~|마감/.test(line) && !/시작/.test(line)) {
      const found = deadlineFrom(line, now, /까지|~/.test(line));
      if (found?.deadlineKind === "date") return found;
    }
  }
  if (/상시\s*(채용|모집)/.test(text)) return { deadlineKind: "rolling", deadlineDate: null, deadlineTime: null };
  if (/(채용|충원)\s*시\s*(마감|까지)/.test(text)) return { deadlineKind: "until_filled", deadlineDate: null, deadlineTime: null };
  return NO_DEADLINE;
}

const bareCompany = (name: string) => name.replace(/\(주\)|（주）|㈜|주식회사/g, "").trim();
const tidyHeadline = (title: string) =>
  title
    .replace(/\s*\((?:~|D-|\d+\s*명)[^)]*\)\s*$/i, "")
    .replace(/\s*(채용\s*공고|채용|모집\s*공고|모집)\s*[.!]*$/, "")
    .trim();

// 항목 이름이 없을 때 첫 줄에서 회사·직무 짐작: "[회사] 직무 채용" · "㈜회사에서 직무를 모집합니다" · "직무 채용"
function fromHeadline(lines: string[]) {
  for (const raw of lines.slice(0, 15)) {
    const line = raw.replace(/\uFE0F/g, "").replace(/^[^\p{L}\p{N}[(（㈜]+/u, "").trim();
    if (!line) continue;
    const bracket = /^\[([^\]]{1,30})\]\s*(.*)$/.exec(line);
    if (bracket && !LABELS.company.test(bracket[1])) {
      // "[디자인 채용 2차] BX · UI" 처럼 괄호 안이 회사 이름이 아닌 경우가 많다 → 그때는 직무만
      const notCompany = GENERIC_WORD.test(bracket[1]) || /채용|모집|공고|\d\s*차|부문|디자이너|마케터|기획|개발자|매니저|담당|多|복리후생|스펙|급구|우대/.test(bracket[1]);
      return { company: notCompany ? null : bareCompany(bracket[1]), jobTitle: tidyHeadline(bracket[2]) || null };
    }
    const sentence = /^(\S+?)에서\s+(.+?)(?:을|를)\s*(?:모집|채용|찾)/.exec(line);
    if (sentence) {
      const title = sentence[2].replace(/^함께할\s*/, "").trim();
      return { company: bareCompany(sentence[1]), jobTitle: title && title.length <= 30 ? title : null };
    }
    const corp = /^(?:\(주\)|（주）|㈜|주식회사\s*)(\S+)\s*(.*)$/.exec(line);
    if (corp) {
      const name = corp[1].replace(/(은|는|이|가)$/, "");
      const title = tidyHeadline(corp[2]);
      return { company: name, jobTitle: title && title.length <= 30 && name === corp[1] ? title : null };
    }
    // "OO 채용" 줄의 첫 낱말은 회사일 때도 직무일 때도 있어 회사로 짐작하지 않는다 (실제 공고에서 틀림)
    if (/(채용|모집)(\s*공고)?\s*[.!]*$/.test(line)) return { company: null, jobTitle: tidyHeadline(line) || null };
  }
  return { company: null, jobTitle: null };
}

// 문장 속 근무지: "근무지는 경기 성남시 분당구이며"
function locationFromSentence(text: string) {
  const m = /근무\s*(?:지역|지|장소|위치)(?:는|은)\s+([^,.\n]+?)(?:이며|이고|입니다|에서|,|\.|\n|$)/.exec(text);
  return m && REGION.test(m[1].trim()) ? m[1].trim() : null;
}

const tidyLocation = (value: string) =>
  value
    .replace(/\s*(지도\s*보기|길찾기).*$/, "")
    .replace(/^주소\s*/, "")
    .replace(/^\(\d{5}\)\s*/, "")
    .replace(/^([가-힣]{2,4})\s*:\s*/, "$1 ")
    .replace(/\s*→\s*/g, ", ")
    .slice(0, 60)
    .trim() || null;

// 문장 속 제출 서류: "이력서와 자기소개서를 제출해 주세요" · "포트폴리오 필수 첨부"
function docsFromSentence(lines: string[]) {
  const found = new Set<string>();
  for (const line of lines) {
    if (!/제출|첨부|필수/.test(line) || /우대|합격|허위|반환/.test(line) || line.length > 80) continue;
    for (const w of DOC_WORDS) if (w !== "과제" && line.replace(/포토폴리오/g, "포트폴리오").includes(w)) found.add(w);
  }
  return [...found];
}

// 항목 이름 없는 전형 절차: "서류 ➡️ 면접 ➡️ 최종" · "서류 심사, 면접, 최종 합격 순서로"
function stepsFromSentence(lines: string[]) {
  for (const line of lines) {
    const clean = stripLead(line.replace(/\uFE0F/g, ""));
    const ordered = /^(?:전형은\s*)?(.+?)\s*(?:의\s*)?(?:순서로|순으로)/.exec(clean);
    const candidate = ordered ? ordered[1] : /(→|➡|▶|>|＞)/.test(clean) ? clean : null;
    // 항목 이름이 없으면 첫 단계가 서류·지원·접수일 때만 전형 절차로 본다 (직무 분류표 "인사 > 담당분야 > 면접" 등)
    if (candidate && /^\s*(서류|지원|접수|입사\s*지원)/.test(candidate)) {
      const steps = stepsFrom(candidate);
      if (steps.length >= 2) return steps;
    }
  }
  return [];
}

export function readKeywordFields(text: string, now: Date = new Date()): KeywordFields {
  const lines = text
    .replace(BULLETS, "\n")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const body = lines.join("\n");

  // 값이 문장처럼 길면 항목 값이 아니다 (표 머리글 다음 줄의 소개 글 등)
  const shortValue = (max: number) => (v: string) => v.length <= max && !/니다[.!]?$/.test(v);
  const companyLabel = findLabelValue(lines, "company", shortValue(30)) ?? emojiValue(lines, "company");
  const titleLabel = findLabelValue(lines, "jobTitle", shortValue(40)) ?? emojiValue(lines, "jobTitle");
  const headline = fromHeadline(lines);
  const guessed: KeywordFields["guessed"] = [];
  if (!companyLabel && headline.company) guessed.push("company");
  if (!titleLabel && headline.jobTitle) guessed.push("jobTitle");

  const employment = findLabelValue(lines, "employmentType", (v) => employmentFrom(v) !== null);
  // 같은 항목이 여럿이면 지역 이름으로 시작하는 값을 먼저 쓴다
  const location = findLabelValue(lines, "location", (v) => REGION.test(v)) ?? findLabelValue(lines, "location") ?? emojiValue(lines, "location") ?? locationFromSentence(body);
  const address = location ?? findLabelValue(lines, "address", (v) => REGION.test(v));
  const steps = findLabelValue(lines, "steps", (v) => stepsFrom(v).length >= 2);
  const docs = findLabelValue(lines, "requiredDocs", (v) => docsFrom(v).length > 0);

  return {
    company: companyLabel ? bareCompany(companyLabel) : headline.company,
    jobTitle: titleLabel ? tidyHeadline(titleLabel) : headline.jobTitle,
    // 항목 이름이 없으면 본문 앞부분에 고용 형태 낱말이 딱 하나 있을 때만 쓴다
    employmentType: employment ? employmentFrom(employment) : soleEmployment(body.slice(0, 2000)),
    location: address ? tidyLocation(address) : null,
    steps: steps ? stepsFrom(steps) : stepsFromSentence(lines),
    requiredDocs: [...new Set([...(docs ? docsFrom(docs) : []), ...docsFromSentence(lines)])],
    ...readDeadline(lines, body, now),
    guessed,
  };
}
