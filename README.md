# 과정노트 — 랜딩 페이지

작업하며 남긴 메모가 케이스 스터디가 돼요. (연습용으로 만든 가상의 서비스예요)
AI 프로덕트 빌더 클럽 3기 실습으로 만들었어요.

## 주소

- 사이트: https://haena-cell-builder.vercel.app
- GitHub 저장소: https://github.com/haena-cell/haena-cell-builder
- Supabase 대시보드: https://supabase.com/dashboard/project/bihquhcrlnjivukceqae

## Supabase

연결만 해 둔 상태예요. 다음 주에 신청 저장 같은 기능을 붙일 때 써요.
연결 코드는 `src/lib/supabase.ts` 에 있어요.

## 다시 고칠 때

Claude 나 Codex 앱에서 이 폴더를 열고 고쳐 달라고 말한 다음, 아래 명령으로 저장하고 올려요.

```bash
git add -A && git commit -m "수정" && git push
```

GitHub 에 올리면 Vercel 이 알아서 사이트를 다시 올려요 (자동 배포).

## 도메인 붙이기

내 도메인(예: mysite.com)을 쓰고 싶으면 vercel.com 의 이 프로젝트 → Settings → Domains 에서 추가해요.
