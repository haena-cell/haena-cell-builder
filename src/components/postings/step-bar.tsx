import { cn } from "@/lib/utils";
import type { PostingStep } from "@/lib/postings";

// 전형 단계 표시바 (DESIGN v3): 얇은 막대 칸. 끝난 단계 주황, 지금 단계 어두운 회색, 남은 단계 옅은 회색 (2026-11-12)
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
                isCurrent && !done && "bg-foreground/45",
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

// 목록 표의 진행 단계 (D-26 → DESIGN v3): 단계마다 얇은 막대 칸. 끝난 단계 주황, 지금 단계 어두운 회색, 남은 단계 옅은 회색 (2026-11-12)
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
                isCurrent && !done && "bg-foreground/45",
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

// 지금 단계 끝내기 (2026-11-12 사용자 요청): [제출 완료]·[다음 단계로] 를 둥근 체크 하나로.
// 평소에는 회색, 마우스를 올리거나 누르면 주황 바탕 + 흰 체크. 진행 단계 바로 옆에 둔다
export function StepDoneButton({ stepName, onClick, className }: { stepName: string; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${stepName} 완료`}
      title={`${stepName} 완료`}
      className={cn(
        "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground/25 transition-colors",
        "hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:outline-none active:bg-primary-hover",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5.5 12.5l4.25 4.25L18.5 8" />
      </svg>
    </button>
  );
}
