-- 공고 시기(상반기·하반기)를 마감일과 따로 정할 수 있게 (2026-11-13 사용자 요청: 목록에서 끌어서 시기 바꾸기, D-74)
-- 값 예: '2026 상', '2025 하'. 비어 있으면 화면에서 마감일로 계산한다. 접근 규칙(RLS)은 postings 기존 규칙 그대로
alter table public.postings
  add column period text check (period is null or period ~ '^[0-9]{4} (상|하)$');
