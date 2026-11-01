"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { defaultPrepLabels, PRIORITIES, type DeadlineKind, type Priority } from "@/lib/postings";
import { normalizeSourceUrl } from "@/lib/source-url";
import type { ExtractedPosting } from "@/lib/extract-posting";
import type { Json } from "@/lib/database.types";

// 화면에서 부르는 공고 저장·수정·삭제. 누가 무엇을 바꿀 수 있는지는 DB 접근 규칙(RLS)이 본인 것만으로 막는다.

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; message: string; existingId?: string };

export type PostingSummary = { id: string; company: string; jobTitle: string };

const FAILED = "저장하지 못했어요. 다시 시도해 주세요.";
const KINDS: DeadlineKind[] = ["date", "rolling", "until_filled"];

export type PostingFields = {
  company: string;
  jobTitle: string;
  deadlineKind: DeadlineKind;
  deadlineAt: string | null;
  deadlineTimeKnown: boolean;
  location: string | null;
  employmentType: string | null;
  companySize: string | null;
};

export type NewPosting = PostingFields & {
  requiredDocs: string[];
  steps: string[];
  sourceKind: "link" | "text" | "image";
  sourceUrl: string | null;
  sourceText?: string | null; // 글 붙여넣기 원문 (D-30)
  aiRaw: ExtractedPosting | null;
};

const clean = (v: string | null | undefined) => v?.trim() || null;

// 칸 확인 (화면에서도 막지만 서버에서 한 번 더)
function checkFields(f: PostingFields): string | null {
  const company = f.company?.trim() ?? "";
  const jobTitle = f.jobTitle?.trim() ?? "";
  if (!company || company.length > 100 || !jobTitle || jobTitle.length > 100) return "기업명과 직무를 1~100자로 채워 주세요.";
  if (!KINDS.includes(f.deadlineKind)) return "마감일을 골라 주세요.";
  if (f.deadlineKind === "date" && (!f.deadlineAt || Number.isNaN(Date.parse(f.deadlineAt)))) return "마감 날짜를 골라 주세요.";
  return null;
}

function fieldsToRow(f: PostingFields) {
  const isDate = f.deadlineKind === "date";
  return {
    company: f.company.trim(),
    job_title: f.jobTitle.trim(),
    deadline_kind: f.deadlineKind,
    deadline_at: isDate ? new Date(f.deadlineAt!).toISOString() : null,
    deadline_time_known: isDate && f.deadlineTimeKnown,
    location: clean(f.location),
    employment_type: clean(f.employmentType),
    company_size: clean(f.companySize),
  };
}

export async function createPosting(input: NewPosting): Promise<ActionResult<{ id: string }>> {
  const problem = checkFields(input);
  if (problem) return { ok: false, message: problem };
  const steps = input.steps.map((s) => s.trim()).filter((s) => s.length > 0 && s.length <= 50);
  if (steps.length === 0) return { ok: false, message: "전형 단계를 하나 이상 넣어 주세요." };
  const docs = [...new Set(input.requiredDocs.map((d) => d.trim()).filter((d) => d.length > 0 && d.length <= 50))];

  const row = { ...fieldsToRow(input), required_docs: docs };
  const sourceUrl = /^https?:\/\/\S+$/i.test(input.sourceUrl?.trim() ?? "") ? input.sourceUrl!.trim().slice(0, 2000) : null;
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("postings")
    .insert({
      ...row,
      source_kind: input.sourceKind,
      // 링크로 넣었거나, 링크를 못 읽어 글·캡처로 넣었을 때 함께 받은 링크 (D-31)
      source_url: sourceUrl,
      source_url_normalized: normalizeSourceUrl(sourceUrl),
      source_text: input.sourceKind === "text" ? input.sourceText?.slice(0, 20_000) || null : null,
      ai_raw: (input.aiRaw ?? null) as Json,
      confirmed: { ...row, steps } as Json,
    })
    .select("id")
    .single();
  if (error?.code === "23505") {
    const existing = await findSavedByLink(input.sourceUrl ?? "");
    return { ok: false, message: "이미 저장한 공고예요.", existingId: existing?.id };
  }
  if (error || !data) return { ok: false, message: FAILED };

  const postingId = data.id;
  const [stepsResult, prepResult] = await Promise.all([
    supabase.from("posting_steps").insert(steps.map((name, i) => ({ posting_id: postingId, position: i + 1, name }))),
    supabase
      .from("prep_items")
      .insert(defaultPrepLabels(docs).map((label, i) => ({ posting_id: postingId, position: i + 1, label }))),
  ]);
  if (stepsResult.error || prepResult.error) {
    // 반쯤 저장된 공고를 남기지 않는다
    await supabase.from("postings").delete().eq("id", postingId);
    return { ok: false, message: FAILED };
  }
  return { ok: true, id: postingId };
}

export async function updatePosting(id: string, fields: PostingFields): Promise<ActionResult> {
  const problem = checkFields(fields);
  if (problem) return { ok: false, message: problem };
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.from("postings").update(fieldsToRow(fields)).eq("id", id).select("id");
  return !error && data.length === 1 ? { ok: true } : { ok: false, message: FAILED };
}

// 목록 줄에서 고르는 우선순위·근로형태 (D-26)
export async function updatePostingMeta(
  id: string,
  meta: { priority?: Priority; employmentType?: string | null },
): Promise<ActionResult> {
  if (meta.priority && !PRIORITIES.some((p) => p.value === meta.priority)) return { ok: false, message: FAILED };
  const row: { priority?: Priority; employment_type?: string | null } = {};
  if (meta.priority) row.priority = meta.priority;
  if (meta.employmentType !== undefined) row.employment_type = meta.employmentType?.trim().slice(0, 50) || null;
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.from("postings").update(row).eq("id", id).select("id");
  return !error && data.length === 1 ? { ok: true } : { ok: false, message: FAILED };
}

export async function deletePosting(id: string): Promise<ActionResult> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.from("postings").delete().eq("id", id).select("id");
  return !error && data.length === 1 ? { ok: true } : { ok: false, message: "지우지 못했어요. 다시 시도해 주세요." };
}

// [제출 완료] / [되돌리기]
export async function setStepCompleted(stepId: string, completed: boolean): Promise<ActionResult> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("posting_steps")
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq("id", stepId)
    .select("id");
  return !error && data.length === 1 ? { ok: true } : { ok: false, message: FAILED };
}

export async function setPrepDone(itemId: string, done: boolean): Promise<ActionResult> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.from("prep_items").update({ done }).eq("id", itemId).select("id");
  return !error && data.length === 1 ? { ok: true } : { ok: false, message: FAILED };
}

// 같은 링크로 이미 저장한 공고 (정리하기 전에 미리 알려 주기, T-08)
export async function findSavedByLink(url: string): Promise<PostingSummary | null> {
  const normalized = normalizeSourceUrl(url);
  if (!normalized) return null;
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("postings")
    .select("id, company, job_title")
    .eq("source_url_normalized", normalized)
    .maybeSingle();
  return data ? { id: data.id, company: data.company, jobTitle: data.job_title } : null;
}

const kstDay = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date(iso)) : null;

// 기업명 + 직무 + 마감일(한국 날짜)이 같은 공고. 막지는 않고 경고만 한다 (DB.md 7번)
export async function findSimilarPostings(
  f: Pick<PostingFields, "company" | "jobTitle" | "deadlineKind" | "deadlineAt">,
): Promise<PostingSummary[]> {
  const company = f.company?.trim();
  const jobTitle = f.jobTitle?.trim();
  if (!company || !jobTitle) return [];
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("postings")
    .select("id, company, job_title, deadline_at")
    .eq("company", company)
    .eq("job_title", jobTitle);
  const day = f.deadlineKind === "date" ? kstDay(f.deadlineAt) : null;
  return (data ?? [])
    .filter((p) => kstDay(p.deadline_at) === day)
    .map((p) => ({ id: p.id, company: p.company, jobTitle: p.job_title }));
}

// 현재 단계를 직접 고른다 (되돌리기·건너뛰기). current 앞 단계는 끝낸 것으로, current 부터는 안 끝낸 것으로.
// current 가 단계 수와 같으면 "전형 끝".
export async function setCurrentStep(postingId: string, current: number): Promise<ActionResult> {
  if (!Number.isInteger(current) || current < 0) return { ok: false, message: FAILED };
  const supabase = await createSupabaseServer();
  const [undone, done] = await Promise.all([
    supabase
      .from("posting_steps")
      .update({ completed_at: null })
      .eq("posting_id", postingId)
      .gt("position", current)
      .not("completed_at", "is", null),
    supabase
      .from("posting_steps")
      .update({ completed_at: new Date().toISOString() })
      .eq("posting_id", postingId)
      .lte("position", current)
      .is("completed_at", null),
  ]);
  return undone.error || done.error ? { ok: false, message: FAILED } : { ok: true };
}

// ── 준비 항목 할 일 (D-20) ──────────────────────────────

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const cleanDate = (v: string | null) => (v && DATE.test(v) ? v : null);
const cleanLabel = (v: string, max: number) => {
  const label = v.trim();
  return label.length >= 1 && label.length <= max ? label : null;
};

// 맨 뒤 순서 번호
const nextPosition = (rows: { position: number }[] | null) => (rows?.[0]?.position ?? 0) + 1;

export async function addPrepItem(postingId: string, rawLabel: string): Promise<ActionResult<{ id: string }>> {
  const label = cleanLabel(rawLabel, 50);
  if (!label) return { ok: false, message: "항목 이름을 1~50자로 적어 주세요." };
  const supabase = await createSupabaseServer();
  const { data: last } = await supabase
    .from("prep_items")
    .select("position")
    .eq("posting_id", postingId)
    .order("position", { ascending: false })
    .limit(1);
  const position = nextPosition(last);
  const { data, error } = await supabase
    .from("prep_items")
    .insert({ posting_id: postingId, position, label })
    .select("id")
    .single();
  return error || !data ? { ok: false, message: FAILED } : { ok: true, id: data.id };
}

export async function updatePrepItem(
  itemId: string,
  change: { label?: string; dueDate?: string | null },
): Promise<ActionResult> {
  const row: { label?: string; due_date?: string | null } = {};
  if (change.label !== undefined) {
    const label = cleanLabel(change.label, 50);
    if (!label) return { ok: false, message: "항목 이름을 1~50자로 적어 주세요." };
    row.label = label;
  }
  if (change.dueDate !== undefined) row.due_date = cleanDate(change.dueDate);
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.from("prep_items").update(row).eq("id", itemId).select("id");
  return !error && data.length === 1 ? { ok: true } : { ok: false, message: FAILED };
}

export async function deletePrepItem(itemId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.from("prep_items").delete().eq("id", itemId).select("id");
  return !error && data.length === 1 ? { ok: true } : { ok: false, message: "지우지 못했어요. 다시 시도해 주세요." };
}

export async function addSubtask(prepItemId: string, rawLabel: string): Promise<ActionResult<{ id: string }>> {
  const label = cleanLabel(rawLabel, 100);
  if (!label) return { ok: false, message: "할 일을 1~100자로 적어 주세요." };
  const supabase = await createSupabaseServer();
  const { data: last } = await supabase
    .from("prep_subtasks")
    .select("position")
    .eq("prep_item_id", prepItemId)
    .order("position", { ascending: false })
    .limit(1);
  const position = nextPosition(last);
  const { data, error } = await supabase
    .from("prep_subtasks")
    .insert({ prep_item_id: prepItemId, position, label })
    .select("id")
    .single();
  return error || !data ? { ok: false, message: FAILED } : { ok: true, id: data.id };
}

export async function updateSubtask(
  subtaskId: string,
  change: { label?: string; done?: boolean; dueDate?: string | null },
): Promise<ActionResult> {
  const row: { label?: string; done?: boolean; due_date?: string | null } = {};
  if (change.label !== undefined) {
    const label = cleanLabel(change.label, 100);
    if (!label) return { ok: false, message: "할 일을 1~100자로 적어 주세요." };
    row.label = label;
  }
  if (change.done !== undefined) row.done = change.done;
  if (change.dueDate !== undefined) row.due_date = cleanDate(change.dueDate);
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.from("prep_subtasks").update(row).eq("id", subtaskId).select("id");
  return !error && data.length === 1 ? { ok: true } : { ok: false, message: FAILED };
}

export async function deleteSubtask(subtaskId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.from("prep_subtasks").delete().eq("id", subtaskId).select("id");
  return !error && data.length === 1 ? { ok: true } : { ok: false, message: "지우지 못했어요. 다시 시도해 주세요." };
}
