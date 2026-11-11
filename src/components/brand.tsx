import { cn } from "@/lib/utils";

// 로고 (D-56): 소문자 hurdle, Outfit 700. 아이콘은 주황 둥근 네모 안에 흰 소문자 h
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[22%] bg-primary pb-[0.08em] font-logo leading-none font-bold text-primary-foreground",
        className,
      )}
    >
      h
    </span>
  );
}

// 로고 글자만
export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("font-logo font-bold tracking-[-0.03em]", className)}>hurdle</span>;
}

// 서비스 이름 + 아이콘
export function BrandName({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={cn("inline-flex items-center gap-2", size === "sm" ? "text-base" : size === "md" ? "text-xl" : "text-[28px]", className)}
      aria-label="Hurdle"
    >
      <BrandMark className={size === "lg" ? "size-8 text-[22px]" : size === "md" ? "size-7 text-[20px]" : "size-6 text-[17px]"} />
      <Wordmark />
    </span>
  );
}
