import type { Posting } from "@/lib/postings";

// 마감일을 내 캘린더로 보내기: .ics 파일 / 구글 캘린더 일정 추가 링크.
// 캘린더 로그인 권한 없이 동작한다 (D-05). 시각이 없는 마감은 그날 하루 종일 일정으로 넣는다.

type CalendarPosting = Pick<
  Posting,
  "id" | "company" | "jobTitle" | "deadlineKind" | "deadlineAt" | "deadlineTimeKnown" | "sourceUrl"
>;

const HOUR_MS = 60 * 60 * 1000;

// 2026-10-27T14:59:00.000Z → 20261027T145900Z
function toUtcStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// 한국 시간 날짜 → 20261027
function toKstDateStamp(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(date).replace(/-/g, "");
}

function nextDayStamp(stamp: string) {
  const d = new Date(`${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function eventInfo(posting: CalendarPosting) {
  if (posting.deadlineKind !== "date" || !posting.deadlineAt) return null;
  const deadline = new Date(posting.deadlineAt);
  const title = `[마감] ${posting.company} · ${posting.jobTitle}`;
  const details = posting.sourceUrl ? `공고: ${posting.sourceUrl}` : "";
  if (posting.deadlineTimeKnown) {
    // 마감 1시간 전부터 마감 시각까지
    return { title, details, allDay: false, start: toUtcStamp(new Date(deadline.getTime() - HOUR_MS)), end: toUtcStamp(deadline) };
  }
  const day = toKstDateStamp(deadline);
  return { title, details, allDay: true, start: day, end: nextDayStamp(day) };
}

export function canAddToCalendar(posting: CalendarPosting) {
  return eventInfo(posting) !== null;
}

export function googleCalendarUrl(posting: CalendarPosting) {
  const info = eventInfo(posting);
  if (!info) return null;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: info.title,
    dates: `${info.start}/${info.end}`,
    details: info.details,
    ctz: "Asia/Seoul",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

// .ics 글자 안의 특수문자 처리
function escapeIcs(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function icsFile(posting: CalendarPosting) {
  const info = eventInfo(posting);
  if (!info) return null;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ireum-mijeong//posting//KO",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${posting.id}@ireum-mijeong`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    info.allDay ? `DTSTART;VALUE=DATE:${info.start}` : `DTSTART:${info.start}`,
    info.allDay ? `DTEND;VALUE=DATE:${info.end}` : `DTEND:${info.end}`,
    `SUMMARY:${escapeIcs(info.title)}`,
    ...(info.details ? [`DESCRIPTION:${escapeIcs(info.details)}`] : []),
    // 하루 전 알림
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcs(info.title)}`,
    "TRIGGER:-P1D",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
