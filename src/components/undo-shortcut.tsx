"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { clearUndo, undoLast } from "@/lib/undo";

// 글자를 쓰는 칸 안에서는 원래대로 글자 되돌리기
const NOT_TEXT = new Set(["checkbox", "radio", "button", "submit", "reset", "range", "color", "file"]);
function isTextField(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable || el instanceof HTMLTextAreaElement) return true;
  return el instanceof HTMLInputElement && !NOT_TEXT.has(el.type);
}

// Ctrl+Z · ⌘Z 를 누르면 방금 한 체크·고치기를 되돌린다 (D-62)
export function UndoShortcut() {
  const pathname = usePathname();
  useEffect(() => clearUndo(), [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // 한글 입력 상태에서도 되도록 글자 대신 키 위치(KeyZ)로 본다
      if (e.code !== "KeyZ" || !(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
      if (isTextField(e.target)) return;
      e.preventDefault();
      undoLast();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
