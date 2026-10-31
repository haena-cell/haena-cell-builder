// 같은 공고 링크인지 비교하려고 링크를 정리한다: 추적용 꼬리표(utm_ 등)·#뒷부분·끝 슬래시를 떼고 주소는 소문자로.
const TRACKING = /^(utm_|fbclid$|gclid$|igshid$|ref$|ref_src$|si$)/i;

export function normalizeSourceUrl(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    url.hash = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    for (const key of [...url.searchParams.keys()]) if (TRACKING.test(key)) url.searchParams.delete(key);
    url.searchParams.sort();
    const path = url.pathname.replace(/\/+$/, "");
    const query = url.searchParams.toString();
    return `${url.protocol}//${url.host}${path}${query ? `?${query}` : ""}`;
  } catch {
    return null;
  }
}
