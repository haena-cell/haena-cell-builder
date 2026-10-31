import { createSupabaseServer } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import type { Posting } from "@/lib/postings";

// DB 에서 내 공고 읽기. 접근 규칙(RLS) 때문에 로그인한 본인 것만 나온다.

type Row = Database["public"]["Tables"]["postings"]["Row"] & {
  posting_steps: Database["public"]["Tables"]["posting_steps"]["Row"][];
  prep_items: Database["public"]["Tables"]["prep_items"]["Row"][];
};

const SELECT = "*, posting_steps(*), prep_items(*)";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toPosting(row: Row): Posting {
  return {
    id: row.id,
    company: row.company,
    jobTitle: row.job_title,
    deadlineKind: row.deadline_kind as Posting["deadlineKind"],
    deadlineAt: row.deadline_at,
    deadlineTimeKnown: row.deadline_time_known,
    location: row.location,
    employmentType: row.employment_type,
    companySize: row.company_size,
    requiredDocs: row.required_docs,
    sourceUrl: row.source_url,
    steps: [...row.posting_steps]
      .sort((a, b) => a.position - b.position)
      .map((s) => ({ id: s.id, name: s.name, completedAt: s.completed_at })),
    prepItems: [...row.prep_items]
      .sort((a, b) => a.position - b.position)
      .map((p) => ({ id: p.id, label: p.label, done: p.done })),
    isSample: row.is_sample,
  };
}

// 내 공고 전체. 하나도 없으면 연습용 예시 3개를 내 계정에 넣고 다시 읽는다 (T-16, DB.md 10번).
export async function getMyPostings(): Promise<Posting[]> {
  const supabase = await createSupabaseServer();
  const read = () => supabase.from("postings").select(SELECT).order("created_at");
  let { data, error } = await read();
  if (error || !data) throw new Error("공고를 불러오지 못했어요.");
  if (data.length === 0) {
    const seeded = await supabase.rpc("create_sample_postings");
    if (!seeded.error && seeded.data > 0) ({ data, error } = await read());
    if (error || !data) throw new Error("공고를 불러오지 못했어요.");
  }
  return (data as Row[]).map(toPosting);
}

// 공고 하나. 없거나 남의 것이면 null.
export async function getMyPosting(id: string): Promise<Posting | null> {
  if (!UUID.test(id)) return null;
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from("postings").select(SELECT).eq("id", id).maybeSingle();
  return data ? toPosting(data as Row) : null;
}
