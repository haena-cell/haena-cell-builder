"use client";

// 연습용 임시 저장: 로그인·DB 연결(T-03) 전까지 이 브라우저 탭 안(sessionStorage)에만 둔다 (D-15).
// 탭을 닫으면 사라진다. 실제 저장으로 바꿀 때 이 파일을 쓰는 곳만 고친다.
import type { ExtractedPosting } from "@/lib/extract-posting";
import type { Posting } from "@/lib/postings";

export type DraftSource =
  | { kind: "link"; url: string }
  | { kind: "text" }
  | { kind: "image"; previewDataUrl: string };

export type Draft = {
  posting: ExtractedPosting;
  isExample: boolean;
  source: DraftSource;
};

const DRAFT_KEY = "practice:draft";
const POSTINGS_KEY = "practice:postings";
const SAMPLES_ADDED_KEY = "practice:samples-added";
const JUST_SAVED_KEY = "practice:just-saved";

function read<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // 저장소를 못 쓰는 브라우저면 무시
  }
}

export const saveDraft = (draft: Draft) => write(DRAFT_KEY, draft);
export const loadDraft = () => read<Draft>(DRAFT_KEY);
export const clearDraft = () => remove(DRAFT_KEY);

// 이 탭의 공고 전체. 처음 한 번은 연습용 예시 공고를 함께 넣어 둔다.
export function loadPostings(samples: Posting[]) {
  const stored = read<Posting[]>(POSTINGS_KEY) ?? [];
  if (read<boolean>(SAMPLES_ADDED_KEY)) return stored;
  const merged = [...samples.filter((s) => !stored.some((p) => p.id === s.id)), ...stored];
  write(POSTINGS_KEY, merged);
  write(SAMPLES_ADDED_KEY, true);
  return merged;
}

export const savePostings = (postings: Posting[]) => write(POSTINGS_KEY, postings);

export function addPracticePosting(posting: Posting) {
  const ok = write(POSTINGS_KEY, [...(read<Posting[]>(POSTINGS_KEY) ?? []), posting]);
  if (ok) write(JUST_SAVED_KEY, posting.id);
  return ok;
}

// 방금 저장한 공고 id 를 한 번만 꺼낸다 (목록에서 알림·강조용)
export function takeJustSaved() {
  const id = read<string>(JUST_SAVED_KEY);
  remove(JUST_SAVED_KEY);
  return id;
}
