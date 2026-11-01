import { connection } from "next/server";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth-actions";
import { getCurrentUser } from "@/lib/supabase/server";

// 내 계정 → 로그아웃. 휴대폰 위쪽 바는 사진 동그라미, 컴퓨터 왼쪽 메뉴바는 사진 + 이름
export async function UserMenu({ wide = false }: { wide?: boolean }) {
  // 로그인 확인은 지금 시각으로 만료를 따지므로, 미리 그려 두지 않고 요청 때 그린다
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  const initial = (user.name ?? user.email ?? "?").slice(0, 1).toUpperCase();
  const avatar = (
    <Avatar>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback>{initial}</AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {wide ? (
          <Button variant="ghost" className="h-12 w-full justify-start gap-2.5 px-2 hover:bg-card" aria-label="내 계정">
            {avatar}
            <span className="min-w-0 truncate text-sm font-medium">{user.name ?? user.email}</span>
          </Button>
        ) : (
          <Button variant="ghost" size="icon-lg" aria-label="내 계정">
            {avatar}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={wide ? "start" : "end"} side={wide ? "top" : "bottom"} className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          {user.name && <span className="truncate text-sm font-semibold text-foreground">{user.name}</span>}
          {user.email && <span className="truncate text-xs font-normal">{user.email}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut />
              로그아웃
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
