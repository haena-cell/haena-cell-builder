-- M1 데이터: 공고(postings), 전형 단계(posting_steps), 준비 항목(prep_items)
-- 설계 문서: ../1025_01/DB.md — 모든 표는 로그인한 본인 것만 보고 쓸 수 있다.

-- ─────────────────────────────────────────────
-- 공고
-- ─────────────────────────────────────────────
create table public.postings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company text not null check (char_length(btrim(company)) between 1 and 100),
  job_title text not null check (char_length(btrim(job_title)) between 1 and 100),
  -- date: 날짜 있음 / rolling: 상시 / until_filled: 채용 시 마감
  deadline_kind text not null check (deadline_kind in ('date', 'rolling', 'until_filled')),
  deadline_at timestamptz,
  deadline_time_known boolean not null default false,
  location text,
  employment_type text,
  company_size text,
  required_docs text[] not null default '{}',
  source_kind text not null check (source_kind in ('link', 'text', 'image')),
  source_url text,
  source_url_normalized text,
  ai_raw jsonb,
  confirmed jsonb,
  is_sample boolean not null default false,
  -- 마감 방식이 date 일 때만 마감 일시가 있다
  constraint postings_deadline_matches_kind check ((deadline_kind = 'date') = (deadline_at is not null)),
  -- 단계·준비 항목이 "공고 + 주인"을 함께 가리키도록
  constraint postings_id_user_key unique (id, user_id)
);

-- 같은 사람이 같은 링크를 두 번 저장하지 못하게
create unique index postings_user_source_url_key
  on public.postings (user_id, source_url_normalized)
  where source_url_normalized is not null;
-- 비슷한 공고(기업명+직무) 경고용
create index postings_user_company_job_idx on public.postings (user_id, company, job_title);
-- 목록 마감순 정렬·달력용
create index postings_user_deadline_idx on public.postings (user_id, deadline_at);

-- ─────────────────────────────────────────────
-- 전형 단계
-- ─────────────────────────────────────────────
create table public.posting_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  posting_id uuid not null,
  created_at timestamptz not null default now(),
  position integer not null check (position >= 1),
  name text not null check (char_length(btrim(name)) between 1 and 50),
  completed_at timestamptz,
  constraint posting_steps_posting_fkey foreign key (posting_id, user_id)
    references public.postings (id, user_id) on delete cascade,
  constraint posting_steps_position_key unique (posting_id, position)
);
create index posting_steps_posting_user_idx on public.posting_steps (posting_id, user_id);

-- ─────────────────────────────────────────────
-- 준비 항목
-- ─────────────────────────────────────────────
create table public.prep_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  posting_id uuid not null,
  created_at timestamptz not null default now(),
  position integer not null check (position >= 1),
  label text not null check (char_length(btrim(label)) between 1 and 50),
  done boolean not null default false,
  constraint prep_items_posting_fkey foreign key (posting_id, user_id)
    references public.postings (id, user_id) on delete cascade
);
create index prep_items_posting_user_idx on public.prep_items (posting_id, user_id);

-- ─────────────────────────────────────────────
-- 공고를 고치면 updated_at 자동 갱신
-- ─────────────────────────────────────────────
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger postings_set_updated_at
  before update on public.postings
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────
-- 접근 규칙(RLS): 로그인한 본인 것만. 로그인 안 한 사람은 표 자체에 접근 불가
-- ─────────────────────────────────────────────
alter table public.postings enable row level security;
alter table public.posting_steps enable row level security;
alter table public.prep_items enable row level security;

revoke all on table public.postings, public.posting_steps, public.prep_items from anon;
grant select, insert, update, delete on table public.postings, public.posting_steps, public.prep_items to authenticated;

create policy "본인 공고 보기" on public.postings
  for select to authenticated using (user_id = (select auth.uid()));
create policy "본인 공고 추가" on public.postings
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "본인 공고 수정" on public.postings
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "본인 공고 삭제" on public.postings
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "본인 단계 보기" on public.posting_steps
  for select to authenticated using (user_id = (select auth.uid()));
create policy "본인 단계 추가" on public.posting_steps
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "본인 단계 수정" on public.posting_steps
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "본인 단계 삭제" on public.posting_steps
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "본인 준비 항목 보기" on public.prep_items
  for select to authenticated using (user_id = (select auth.uid()));
create policy "본인 준비 항목 추가" on public.prep_items
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "본인 준비 항목 수정" on public.prep_items
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "본인 준비 항목 삭제" on public.prep_items
  for delete to authenticated using (user_id = (select auth.uid()));

-- ─────────────────────────────────────────────
-- 연습용 예시 공고 3개 (공고가 하나도 없는 본인 계정에만, 본인 권한으로)
-- ─────────────────────────────────────────────
create function public.create_sample_postings()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'Asia/Seoul')::date;
  p uuid;
begin
  if uid is null then
    raise exception 'login required';
  end if;

  -- 동시에 두 번 불려도 한 번만 넣는다
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  if exists (select 1 from public.postings where user_id = uid) then
    return 0;
  end if;

  -- 1) 마감 임박 · 서류 제출 단계
  insert into public.postings (user_id, company, job_title, deadline_kind, deadline_at, deadline_time_known,
                               location, employment_type, company_size, required_docs, source_kind, is_sample)
  values (uid, '예시상사', '프로덕트 디자이너', 'date', ((today + 2) + time '23:59') at time zone 'Asia/Seoul', true,
          '서울', '정규직', '중견기업', array['이력서', '포트폴리오', '과제'], 'text', true)
  returning id into p;
  insert into public.posting_steps (user_id, posting_id, position, name) values
    (uid, p, 1, '서류 제출'), (uid, p, 2, '과제'), (uid, p, 3, '면접'), (uid, p, 4, '최종 결과');
  insert into public.prep_items (user_id, posting_id, position, label, done) values
    (uid, p, 1, '이력서', false), (uid, p, 2, '포트폴리오', true), (uid, p, 3, '과제', false);

  -- 2) 진행 중 · 서류 결과 대기
  insert into public.postings (user_id, company, job_title, deadline_kind, deadline_at, deadline_time_known,
                               location, employment_type, company_size, required_docs, source_kind, is_sample)
  values (uid, '샘플랩', 'UX 리서처 인턴', 'date', ((today + 10) + time '18:00') at time zone 'Asia/Seoul', true,
          '판교', '인턴', '스타트업', array['이력서', '포트폴리오'], 'text', true)
  returning id into p;
  insert into public.posting_steps (user_id, posting_id, position, name, completed_at) values
    (uid, p, 1, '서류 제출', now()), (uid, p, 2, '서류 결과', null), (uid, p, 3, '면접', null), (uid, p, 4, '최종 결과', null);
  insert into public.prep_items (user_id, posting_id, position, label, done) values
    (uid, p, 1, '이력서', true), (uid, p, 2, '포트폴리오', true);

  -- 3) 상시 모집
  insert into public.postings (user_id, company, job_title, deadline_kind, deadline_at, deadline_time_known,
                               location, employment_type, company_size, required_docs, source_kind, is_sample)
  values (uid, '연습스튜디오', '브랜드 디자이너', 'rolling', null, false,
          '서울', '계약직', '소기업', array['이력서', '포트폴리오'], 'text', true)
  returning id into p;
  insert into public.posting_steps (user_id, posting_id, position, name) values
    (uid, p, 1, '서류 제출'), (uid, p, 2, '면접'), (uid, p, 3, '최종 결과');
  insert into public.prep_items (user_id, posting_id, position, label, done) values
    (uid, p, 1, '이력서', false), (uid, p, 2, '포트폴리오', false), (uid, p, 3, '과제', false);

  return 3;
end;
$$;

revoke execute on function public.create_sample_postings() from public, anon;
grant execute on function public.create_sample_postings() to authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
