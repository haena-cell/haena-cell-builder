import Image from "next/image";
import { cn } from "@/lib/utils";
import sit from "@/assets/mascot/sit.png";
import read from "@/assets/mascot/read.png";
import jump from "@/assets/mascot/jump.png";
import understand from "@/assets/mascot/understand.png";
import cheer from "@/assets/mascot/cheer.png";
import ok from "@/assets/mascot/ok.png";
import rest from "@/assets/mascot/rest.png";

// 허들을 같이 넘는 강아지 (D-54). 그림을 바꿀 때는 src/assets/mascot/ 의 파일만 바꿔 끼운다.
// 넘었을 때·비어 있을 때·기다릴 때·막혔을 때만 쓰고, 한 화면에 한 마리만.
const POSES = { sit, read, jump, understand, cheer, ok, rest };

export type MascotPose = keyof typeof POSES;

export function Mascot({
  pose,
  size,
  hop = false,
  className,
}: {
  pose: MascotPose;
  /** 그림 높이(px). 너비는 그림 비율대로 */
  size: number;
  /** 처음 나타날 때 한 번 폴짝. '움직임 줄이기'를 켠 기기에서는 움직이지 않는다 */
  hop?: boolean;
  className?: string;
}) {
  const img = POSES[pose];
  return (
    <Image
      src={img}
      alt=""
      aria-hidden
      height={size}
      width={Math.round((size * img.width) / img.height)}
      className={cn("pointer-events-none shrink-0 select-none", hop && "motion-safe:animate-mascot-hop", className)}
    />
  );
}
