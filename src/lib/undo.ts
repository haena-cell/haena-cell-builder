"use client";

import { toast } from "sonner";

// Ctrl+Z / ⌘Z 로 되돌리기 (D-62). 지금 화면에서 한 체크·고치기를 최근 것부터 차례로 되돌린다.
// 다른 메뉴로 옮기면 비운다(그 화면의 상태가 사라지므로).

type Entry = { label: string; undo: () => unknown };

const MAX = 30;
let stack: Entry[] = [];
let running = false;

// 되돌릴 일을 쌓는다. 돌려주는 함수를 부르면 그 일만 바로 되돌린다(알림의 [되돌리기] 버튼용)
export function pushUndo(label: string, undo: () => unknown): () => Promise<void> {
  const entry: Entry = { label, undo };
  stack.push(entry);
  if (stack.length > MAX) stack.shift();
  return async () => {
    if (!stack.includes(entry)) return;
    stack = stack.filter((e) => e !== entry);
    await entry.undo();
  };
}

export function clearUndo() {
  stack = [];
}

export async function undoLast() {
  if (running) return;
  const entry = stack.pop();
  if (!entry) {
    toast("되돌릴 일이 없어요", { id: "undo" });
    return;
  }
  running = true;
  try {
    await entry.undo();
    toast(`되돌렸어요 · ${entry.label}`, { id: "undo" });
  } finally {
    running = false;
  }
}
