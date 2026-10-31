-- 준비 항목 할 일 (D-20): 준비 항목 마감 날짜 + 하위 할 일 표

-- 준비 항목의 마감 날짜 (한국 날짜, 비어 있어도 됨)
alter table public.prep_items add column due_date date;

-- 하위 할 일이 "준비 항목 + 주인"을 함께 가리키도록
alter table public.prep_items add constraint prep_items_id_user_key unique (id, user_id);

create table public.prep_subtasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  prep_item_id uuid not null,
  created_at timestamptz not null default now(),
  position integer not null check (position >= 1),
  label text not null check (char_length(btrim(label)) between 1 and 100),
  done boolean not null default false,
  due_date date,
  -- 준비 항목을 지우면 하위 할 일도 같이 지워진다. 남의 준비 항목에는 붙일 수 없다
  constraint prep_subtasks_prep_item_fkey foreign key (prep_item_id, user_id)
    references public.prep_items (id, user_id) on delete cascade
);

create index prep_subtasks_prep_item_user_idx on public.prep_subtasks (prep_item_id, user_id);

-- 접근 규칙: 로그인한 본인 것만
alter table public.prep_subtasks enable row level security;

revoke all on table public.prep_subtasks from anon;
grant select, insert, update, delete on table public.prep_subtasks to authenticated;

create policy "본인 하위 할 일 보기" on public.prep_subtasks
  for select to authenticated using (user_id = (select auth.uid()));
create policy "본인 하위 할 일 추가" on public.prep_subtasks
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "본인 하위 할 일 수정" on public.prep_subtasks
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "본인 하위 할 일 삭제" on public.prep_subtasks
  for delete to authenticated using (user_id = (select auth.uid()));
