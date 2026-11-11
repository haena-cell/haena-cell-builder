import { toast } from "sonner";
import { Mascot } from "@/components/mascot";

// 단계를 끝냈을 때 알림 (D-54). 허들 하나 넘을 때마다 강아지가 폴짝, 마지막 단계면 축하
export function stepDoneToast({ label, isLast, undo }: { label: string; isLast: boolean; undo: () => unknown }) {
  toast(isLast ? `${label} 완료 · 마지막 허들까지 넘었어요` : `${label} 완료`, {
    icon: <Mascot pose={isLast ? "cheer" : "jump"} size={isLast ? 40 : 32} hop />,
    classNames: { icon: "size-auto! m-0! mr-1!" },
    action: { label: "되돌리기", onClick: () => undo() },
  });
}
