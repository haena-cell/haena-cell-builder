"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, ShieldCheck, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteAccount, signOut } from "@/lib/auth-actions";
import type { CurrentUser } from "@/lib/supabase/server";

export function UserMenuView({ user, wide }: { user: CurrentUser; wide: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initial = (user.name ?? user.email ?? "?").slice(0, 1).toUpperCase();
  const avatar = (
    <Avatar>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback>{initial}</AvatarFallback>
    </Avatar>
  );

  async function confirmDelete() {
    setDeleting(true);
    setError(null);
    const result = await deleteAccount(); // 성공하면 로그인 화면으로 넘어간다
    setDeleting(false);
    if (result && !result.ok) setError(result.message);
  }

  return (
    <>
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
          <DropdownMenuItem asChild>
            <Link href="/privacy">
              <ShieldCheck />
              개인정보처리방침
            </Link>
          </DropdownMenuItem>
          <form action={signOut}>
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full">
                <LogOut />
                로그아웃
              </button>
            </DropdownMenuItem>
          </form>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            <UserX />
            계정 삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirming} onOpenChange={(open) => !deleting && (setConfirming(open), setError(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>계정을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              저장한 공고, 전형 단계, 준비 항목, 할 일이 모두 바로 지워지고 되돌릴 수 없어요. 같은 Google 계정으로 다시
              로그인하면 빈 계정으로 새로 시작해요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              {deleting ? "지우는 중…" : "계정 삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
