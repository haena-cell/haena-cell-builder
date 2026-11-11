-- 계정 삭제 (D-51): 로그인한 본인 계정만 지운다.
-- auth.users 행을 지우면 공고·단계·준비 항목·할 일은 on delete cascade 로 함께 지워지고,
-- 보낸 의견(feedback)은 user_id 만 비워진다(on delete set null).
-- 서버 비밀 키 없이 앱에서 부를 수 있도록 함수 소유자 권한(security definer)으로 실행한다.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not logged in' using errcode = '42501';
  end if;
  delete from auth.users where id = me;
end;
$$;

revoke all on function public.delete_my_account() from public, anon, authenticated;
grant execute on function public.delete_my_account() to authenticated;
