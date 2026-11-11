import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// 웹 베타 표시 (D-36)
export function BetaBadge({ className }: { className?: string }) {
  return <Badge className={cn("bg-primary-soft text-primary-strong", className)}>웹 베타</Badge>;
}
