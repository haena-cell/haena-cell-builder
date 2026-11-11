import { cn } from "@/lib/utils";

// 알약 모양 고르기 탭 (DESIGN.md 4 "고르기 탭"): 흰 알약 바탕에 고른 쪽만 검정
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
  className,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string; icon?: React.ComponentType<{ className?: string }> }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex rounded-md bg-muted p-1", className)} role="radiogroup" aria-label={label}>
      {options.map(({ value: v, label: text, icon: Icon }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          disabled={disabled}
          onClick={() => onChange(v)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3.5 py-2 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60",
            value === v && "bg-card font-semibold text-foreground shadow-xs ring-1 ring-border-subtle hover:text-foreground",
          )}
        >
          {Icon && <Icon className="size-4" />}
          {text}
        </button>
      ))}
    </div>
  );
}
