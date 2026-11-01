-- 공고 우선순위 (D-26): 목록에서 드롭다운으로 고르고 걸러 본다. 접근 규칙은 postings 의 기존 본인 규칙 그대로
alter table public.postings
  add column priority text not null default 'medium'
  check (priority in ('high', 'medium', 'low'));
