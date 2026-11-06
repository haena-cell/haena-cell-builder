import { cn } from "@/lib/utils";

// 임시 아이콘 (D-45): 검정 배경에 흰 대문자 P
export function BrandMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("flex shrink-0 items-center justify-center rounded-[22%] bg-primary leading-none text-primary-foreground", className)}>
      P
    </span>
  );
}

// 서비스 이름 + 아이콘
export function BrandName({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-bold tracking-tight", size === "sm" ? "text-base" : size === "md" ? "text-lg" : "text-2xl", className)}>
      <BrandMark className={size === "lg" ? "size-8 text-lg" : size === "md" ? "size-7 text-base" : "size-6 text-sm"} />
      Pacemate
    </span>
  );
}
