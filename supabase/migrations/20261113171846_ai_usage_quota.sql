-- 사람별 AI 정리 하루 20번 한도 (D-80). 계정 번호·시각만 적고, 공고 내용은 넣지 않는다.
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  used_at timestamptz not null default now()
);

create index ai_usage_user_used_at_idx on public.ai_usage (user_id, used_at);

-- 앱에서 직접 읽거나 쓸 수 없다. 아래 함수로만 자기 기록 1줄을 넣는다
alter table public.ai_usage enable row level security;
revoke all on table public.ai_usage from anon, authenticated;

-- AI 를 부르기 직전에 서버가 부른다. 오늘(한국 날짜) 20번 미만이면 1줄 넣고 true, 아니면 false
create function public.use_ai_quota()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  today_start timestamptz := date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
begin
  if me is null then
    return false;
  end if;
  -- 같은 사람이 동시에 여러 번 불러도 한도를 넘지 않게 한 사람씩 차례로
  perform pg_advisory_xact_lock(hashtext('ai_usage:' || me::text));
  delete from public.ai_usage where user_id = me and used_at < now() - interval '2 days';
  if (select count(*) from public.ai_usage where user_id = me and used_at >= today_start) >= 20 then
    return false;
  end if;
  insert into public.ai_usage (user_id) values (me);
  return true;
end;
$$;

revoke all on function public.use_ai_quota() from public, anon, authenticated;
grant execute on function public.use_ai_quota() to authenticated;
