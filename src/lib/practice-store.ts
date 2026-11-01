"use client";

// 정리 결과(저장 전 초안)를 확인 화면으로 넘기는 임시 보관: 이 브라우저 탭 안(sessionStorage)에만 둔다.
// 탭을 닫으면 사라진다. 저장한 공고는 DB 에 있다 (posting-actions.ts).
import type { ExtractedPosting } from "@/lib/extract-posting";

export type DraftSource =
  | { kind: "link"; url: string }
  | { kind: "text"; text: string; url?: string } // url: 못 읽은 링크도 함께 저장 (D-31)
  | { kind: "image"; previewDataUrl: string; url?: string };

export type Draft = {
  posting: ExtractedPosting;
  isExample: boolean;
  source: DraftSource;
  hint?: string;
  id?: string; // 정리할 때마다 새 번호 — 확인 화면이 이전 결과를 들고 있지 않게 (Activity, 아래 참고)
};

const DRAFT_KEY = "practice:draft";

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

export const saveDraft = (draft: Draft) => write(DRAFT_KEY, { ...draft, id: crypto.randomUUID() });
export const loadDraft = () => read<Draft>(DRAFT_KEY);
export const clearDraft = () => remove(DRAFT_KEY);
