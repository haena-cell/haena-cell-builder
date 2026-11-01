import { cn } from "@/lib/utils";
import type { PostingStep } from "@/lib/postings";

// 전형 단계 표시바: 끝난 단계는 검정 채움, 현재 단계는 검정 테두리, 남은 단계는 회색
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
                "h-1.5 rounded-full",
                done && "bg-primary",
                isCurrent && "bg-card ring-1 ring-primary",
                !done && !isCurrent && "bg-input",
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

// 목록 표의 진행 단계: 단계마다 점, 점 사이를 선으로 잇는다 (D-26). 끝난 단계 검정, 현재 단계 테두리, 남은 단계 회색
export function StepDots({ steps, current }: { steps: PostingStep[]; current: number }) {
  return (
    <ol className="flex items-center" aria-label="전형 단계">
      {steps.map((step, i) => {
        const done = step.completedAt !== null;
        const isCurrent = i === current;
        return (
          <li key={i} className="flex items-center" aria-current={isCurrent ? "step" : undefined}>
            {i > 0 && <span className={cn("h-0.5 w-4 md:w-6", done || isCurrent ? "bg-primary" : "bg-input")} />}
            <span
              title={step.name}
              className={cn(
                "block size-3 rounded-full",
                done && "bg-primary",
                isCurrent && "bg-card ring-2 ring-primary ring-inset",
                !done && !isCurrent && "bg-input",
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
