import { cn } from "@/lib/utils";

// 불러오는 동안 자리를 잡아 두는 회색 상자. 왼쪽에서 오른쪽으로 빛이 지나간다 (D-63)
// 움직임 줄이기 설정을 켠 사람에게는 빛을 보이지 않는다
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-md bg-accent",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[skeleton-shimmer_1.4s_ease-in-out_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-card/80 before:to-transparent motion-reduce:before:hidden",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
