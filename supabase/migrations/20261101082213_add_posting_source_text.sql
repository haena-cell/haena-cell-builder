-- 글 붙여넣기 원문 (D-30): 사용자가 붙여넣은 글을 그대로 저장. 본인만 본다(postings 의 기존 본인 접근 규칙)
alter table public.postings
  add column source_text text
  check (source_text is null or char_length(source_text) <= 20000);
