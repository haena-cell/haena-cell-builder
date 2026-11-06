-- 의견 보내기 (D-36): 로그인 없이도 쓸 수 있고, 앱에서는 아무도 읽을 수 없다. 운영자가 Supabase 대시보드에서 읽는다
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  contact text check (contact is null or char_length(contact) <= 200),
  page text check (page is null or char_length(page) <= 200)
);

alter table public.feedback enable row level security;

revoke all on table public.feedback from anon, authenticated;
-- 쓸 수 있는 칸만 허용 (시각·번호·계정은 서버가 채운다). 보기·수정·삭제 권한은 주지 않는다
grant insert (message, contact, page) on table public.feedback to anon, authenticated;

create policy "누구나 의견 보내기" on public.feedback
  for insert to anon, authenticated
  with check (user_id is not distinct from (select auth.uid()));
