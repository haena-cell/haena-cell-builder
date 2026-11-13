-- 의견 보내기 횟수 제한 (LAUNCH B1, D-79). 공개 키로 DB 에 바로 쓰는 경우까지 막도록 DB 에서 센다.
-- 한 계정은 10분에 5개, 전체(로그인 안 한 사람 포함)는 1시간에 30개까지.
-- 의견은 앱에서 읽을 수 없으므로(RLS) 세는 함수만 소유자 권한(security definer)으로 실행한다.
create function public.feedback_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id is not null and (
    select count(*) from public.feedback
    where user_id = new.user_id and created_at > now() - interval '10 minutes'
  ) >= 5 then
    raise exception 'feedback rate limit' using errcode = 'P0001', hint = 'user';
  end if;
  if (
    select count(*) from public.feedback where created_at > now() - interval '1 hour'
  ) >= 30 then
    raise exception 'feedback rate limit' using errcode = 'P0001', hint = 'global';
  end if;
  return new;
end;
$$;

revoke all on function public.feedback_rate_limit() from public, anon, authenticated;

create index feedback_created_at_idx on public.feedback (created_at);

create trigger feedback_rate_limit
  before insert on public.feedback
  for each row execute function public.feedback_rate_limit();
