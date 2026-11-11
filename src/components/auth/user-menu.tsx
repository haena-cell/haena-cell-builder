import { connection } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { UserMenuView } from "@/components/auth/user-menu-view";

// 내 계정 → 개인정보처리방침·로그아웃·계정 삭제. 휴대폰 위쪽 바는 사진 동그라미, 컴퓨터 왼쪽 메뉴바는 사진 + 이름
export async function UserMenu({ wide = false }: { wide?: boolean }) {
  // 로그인 확인은 지금 시각으로 만료를 따지므로, 미리 그려 두지 않고 요청 때 그린다
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  return <UserMenuView user={user} wide={wide} />;
}
