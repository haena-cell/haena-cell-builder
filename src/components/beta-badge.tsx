import { Badge } from "@/components/ui/badge";

// 웹 베타 표시 (D-36)
export function BetaBadge({ className }: { className?: string }) {
  return <Badge variant="info" className={className}>웹 베타</Badge>;
}
