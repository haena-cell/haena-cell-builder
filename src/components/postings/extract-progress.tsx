"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// 공고를 읽는 동안 보여 주는 안내 (D-47). 시간에 따라 넘어가고, 마지막 줄에서 끝날 때까지 기다린다
const STAGES = [
  "회사명, 직무, 마감일을 읽고 있어요",
  "전형 절차를 확인하고 있어요",
  "제출 서류와 근무지를 찾고 있어요",
  "마지막으로 정리하고 있어요",
];
const STAGE_MS = 1800;

export function ExtractProgress() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), STAGE_MS);
    return () => clearInterval(timer);
  }, []);
  return (
    <ul className="flex flex-col gap-2 rounded-2xl bg-muted px-4 py-3 text-sm" role="status" aria-live="polite">
      {STAGES.map((label, i) => (
        <li key={label} className={cn("flex items-center gap-2.5", i > stage ? "text-muted-foreground/60" : i < stage && "text-muted-foreground", i === stage && "font-medium")}>
          {i < stage ? (
            <Check className="size-4 shrink-0" />
          ) : i === stage ? (
            <Loader2 className="size-4 shrink-0 animate-spin" />
          ) : (
            <span className="size-4 shrink-0" aria-hidden />
          )}
          {label}
        </li>
      ))}
    </ul>
  );
}
