-- 공고마다 메모 칸 (2026-11-13 사용자 요청: "직무 설명이나 메모할 수 있는 메모칸")
-- 접근 규칙(RLS)은 postings 의 기존 규칙 그대로: 본인 행만 읽고 고친다. 새 정책 없음
alter table public.postings
  add column memo text check (memo is null or char_length(memo) <= 5000);
