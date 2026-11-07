import { getMyPosting } from "@/lib/postings-db";

// 크롬 확장 팝업 (D-48): 이미 저장한 공고를 고칠 때 저장된 내용 불러오기. 본인 공고만 (로그인·RLS)
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const posting = id ? await getMyPosting(id) : null;
  if (!posting) return Response.json({ error: "공고를 찾지 못했어요." }, { status: 404 });
  return Response.json({
    posting: {
      company: posting.company,
      jobTitle: posting.jobTitle,
      deadlineKind: posting.deadlineKind,
      deadlineAt: posting.deadlineAt,
      deadlineTimeKnown: posting.deadlineTimeKnown,
      location: posting.location,
      employmentType: posting.employmentType,
      companySize: posting.companySize,
      requiredDocs: posting.requiredDocs,
      steps: posting.steps.map((s) => ({ id: s.id, name: s.name })),
    },
  });
}
