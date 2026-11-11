import { cn } from "@/lib/utils";
import type { PostingStep } from "@/lib/postings";

// 전형 단계 표시바 (DESIGN v3): 얇은 막대 칸. 끝난 단계 파랑, 현재 단계 옅은 파랑, 남은 단계 회색
export function StepBar({ steps, current }: { steps: PostingStep[]; current: number }) {
  return (
    <ol className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((step, i) => {
        const done = step.completedAt !== null;
        const isCurrent = i === current;
        return (
          <li key={i} className="flex min-w-0 flex-col gap-1.5" aria-current={isCurrent ? "step" : undefined}>
            <span
              className={cn(
                "h-1 rounded-full",
                done && "bg-primary",
                isCurrent && !done && "bg-primary/45",
                !done && !isCurrent && "bg-accent",
              )}
            />
            <span
              className={cn(
                "truncate text-xs",
                isCurrent ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {step.name}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// 목록 표의 진행 단계 (D-26 → DESIGN v3): 단계마다 얇은 막대 칸. 끝난 단계 파랑, 현재 단계 옅은 파랑, 남은 단계 회색
export function StepDots({ steps, current }: { steps: PostingStep[]; current: number }) {
  return (
    <ol className="flex w-28 max-w-full items-center gap-1 md:w-36" aria-label="전형 단계">
      {steps.map((step, i) => {
        const done = step.completedAt !== null;
        const isCurrent = i === current;
        return (
          <li key={i} className="min-w-0 flex-1" aria-current={isCurrent ? "step" : undefined}>
            <span
              title={step.name}
              className={cn(
                "block h-1 rounded-full",
                done && "bg-primary",
                isCurrent && !done && "bg-primary/45",
                !done && !isCurrent && "bg-accent",
              )}
            >
              <span className="sr-only">
                {step.name} {done ? "끝남" : isCurrent ? "지금 단계" : "남음"}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
