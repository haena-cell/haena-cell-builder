"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Check, Download, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DeadlineBadge } from "@/components/postings/posting-card";
import { StepBar } from "@/components/postings/step-bar";
import { canAddToCalendar, googleCalendarUrl, icsFile } from "@/lib/calendar";
import {
  currentStepIndex,
  daysLeftFor,
  formatDeadline,
  isSubmitStep,
  type DeadlineKind,
  type Posting,
} from "@/lib/postings";
import { deletePosting, setPrepDone, setStepCompleted as setStepCompletedAction, updatePosting } from "@/lib/posting-actions";
import { cn } from "@/lib/utils";

const DEADLINE_KINDS: { value: DeadlineKind; label: string }[] = [
  { value: "date", label: "날짜" },
  { value: "rolling", label: "상시" },
  { value: "until_filled", label: "채용 시 마감" },
];

function kstParts(iso: string | null, timeKnown: boolean) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
  return { date, time: timeKnown ? time : "" };
}

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold text-muted-foreground">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

// 기본 정보 고치기 (기업명·직무·마감·근무 정보)
function EditForm({ posting, onSave, onCancel }: { posting: Posting; onSave: (p: Posting) => Promise<string | null>; onCancel: () => void }) {
  const initial = kstParts(posting.deadlineAt, posting.deadlineTimeKnown);
  const [company, setCompany] = useState(posting.company);
  const [jobTitle, setJobTitle] = useState(posting.jobTitle);
  const [deadlineKind, setDeadlineKind] = useState<DeadlineKind>(posting.deadlineKind);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [location, setLocation] = useState(posting.location ?? "");
  const [employmentType, setEmploymentType] = useState(posting.employmentType ?? "");
  const [companySize, setCompanySize] = useState(posting.companySize ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !jobTitle.trim()) return setError("기업명과 직무를 채워 주세요.");
    if (deadlineKind === "date" && !date) return setError("마감 날짜를 골라 주세요.");
    setSaving(true);
    const problem = await onSave({
      ...posting,
      company: company.trim(),
      jobTitle: jobTitle.trim(),
      deadlineKind,
      deadlineAt: deadlineKind === "date" ? new Date(`${date}T${time || "23:59"}:00+09:00`).toISOString() : null,
      deadlineTimeKnown: deadlineKind === "date" && time !== "",
      location: location.trim() || null,
      employmentType: employmentType.trim() || null,
      companySize: companySize.trim() || null,
    });
    setSaving(false);
    setError(problem);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-company">기업명</Label>
          <Input id="edit-company" className="h-10" value={company} maxLength={100} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-job">직무</Label>
          <Input id="edit-job" className="h-10" value={jobTitle} maxLength={100} onChange={(e) => setJobTitle(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>마감일</Label>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="마감 방식">
          {DEADLINE_KINDS.map((k) => (
            <Button key={k.value} type="button" variant="outline" size="lg" role="radio" aria-checked={deadlineKind === k.value}
              className={cn(deadlineKind === k.value && "border-primary bg-muted font-semibold")}
              onClick={() => setDeadlineKind(k.value)}>
              {k.label}
            </Button>
          ))}
        </div>
        {deadlineKind === "date" && (
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" aria-label="마감 날짜" className="h-10" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input type="time" aria-label="마감 시각 (없으면 비워 두기)" className="h-10" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-location">근무지</Label>
          <Input id="edit-location" className="h-10" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-type">근무 형태</Label>
          <Input id="edit-type" className="h-10" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-size">기업 규모</Label>
          <Input id="edit-size" className="h-10" value={companySize} onChange={(e) => setCompanySize(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="lg" className="px-5" disabled={saving}>{saving ? "저장 중…" : "저장"}</Button>
        <Button type="button" variant="outline" size="lg" className="px-4" onClick={onCancel}>취소</Button>
      </div>
    </form>
  );
}

export function PostingDetail({ initialPosting, nowIso }: { initialPosting: Posting; nowIso: string }) {
  const router = useRouter();
  const [posting, setPosting] = useState(initialPosting);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const now = new Date(nowIso);

  // 화면을 먼저 바꾸고 DB 에 저장한다. 실패하면 되돌린다.
  async function optimistic(change: (p: Posting) => Posting, save: () => Promise<{ ok: boolean; message?: string }>) {
    const before = posting;
    setPosting(change);
    const result = await save();
    if (!result.ok) {
      setPosting(before);
      toast.error(result.message ?? "저장하지 못했어요. 다시 시도해 주세요.");
    }
    return result.ok;
  }

  function saveStep(stepIndex: number, completed: boolean) {
    const step = posting.steps[stepIndex];
    return optimistic(
      (p) => ({
        ...p,
        steps: p.steps.map((s, i) => (i === stepIndex ? { ...s, completedAt: completed ? new Date().toISOString() : null } : s)),
      }),
      () => setStepCompletedAction(step.id, completed),
    );
  }

  async function completeStep(stepIndex: number) {
    if (!(await saveStep(stepIndex, true))) return;
    toast(`${posting.steps[stepIndex].name} 완료`, {
      action: { label: "되돌리기", onClick: () => saveStep(stepIndex, false) },
    });
  }

  function togglePrep(index: number) {
    const item = posting.prepItems[index];
    optimistic(
      (p) => ({ ...p, prepItems: p.prepItems.map((it, i) => (i === index ? { ...it, done: !it.done } : it)) }),
      () => setPrepDone(item.id, !item.done),
    );
  }

  function downloadIcs() {
    const ics = icsFile(posting);
    if (!ics) return;
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${posting.company}-마감.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function remove() {
    setDeleting(true);
    const result = await deletePosting(posting.id);
    if (!result.ok) {
      setDeleting(false);
      return toast.error(result.message);
    }
    toast(`${posting.company} 공고를 지웠어요`);
    router.push("/app");
  }

  const current = currentStepIndex(posting.steps);
  const step = current === -1 ? null : posting.steps[current];
  const doneCount = posting.prepItems.filter((item) => item.done).length;
  const googleUrl = googleCalendarUrl(posting);

  return (
    <div className="flex flex-col gap-8">
      {/* 머리 */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {posting.isSample && <Badge className="bg-warning text-warning-foreground">연습용 예시</Badge>}
          <DeadlineBadge posting={posting} daysLeft={daysLeftFor(posting, now)} />
        </div>
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">{posting.company}</h1>
        <p className="text-sm text-muted-foreground">{posting.jobTitle}</p>
      </div>

      {editing ? (
        <EditForm
          posting={posting}
          onCancel={() => setEditing(false)}
          onSave={async (next) => {
            const result = await updatePosting(posting.id, next);
            if (!result.ok) return result.message;
            setPosting(next);
            setEditing(false);
            toast("고친 내용을 저장했어요");
            return null;
          }}
        />
      ) : (
        <>
          {/* 전형 단계 */}
          <Section title="전형 단계">
            <StepBar steps={posting.steps} current={current} />
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm">
                지금: <span className="font-semibold">{step ? step.name : "전형 끝"}</span>
              </p>
              {step && (
                <Button variant="outline" size="lg" className="px-3" onClick={() => completeStep(current)}>
                  <Check data-icon="inline-start" />
                  {isSubmitStep(step.name) ? "제출 완료" : "다음 단계로"}
                </Button>
              )}
            </div>
          </Section>
          <Separator />

          {/* 마감 */}
          <Section title="마감">
            <p className="text-base font-semibold tabular-nums">{formatDeadline(posting)}</p>
            {canAddToCalendar(posting) ? (
              <div className="flex flex-wrap gap-2">
                {googleUrl && (
                  <Button variant="outline" size="lg" className="px-3" asChild>
                    <a href={googleUrl} target="_blank" rel="noreferrer">
                      <CalendarPlus data-icon="inline-start" />
                      구글 캘린더에 추가
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="lg" className="px-3" onClick={downloadIcs}>
                  <Download data-icon="inline-start" />
                  캘린더 파일 받기 (맥·아이폰)
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">마감 날짜가 없어서 캘린더에 넣을 수 없어요.</p>
            )}
          </Section>
          <Separator />

          {/* 준비 항목 */}
          <Section
            title="준비 항목"
            aside={<span className="text-xs text-muted-foreground tabular-nums">{doneCount}/{posting.prepItems.length}</span>}
          >
            <ul className="flex flex-col gap-1">
              {posting.prepItems.map((item, i) => (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-2 hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => togglePrep(i)}
                      className="size-4 accent-primary"
                    />
                    <span className={cn("text-sm", item.done && "text-muted-foreground line-through")}>{item.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Section>
          <Separator />

          {/* 공고 정보 */}
          <Section title="공고 정보">
            <dl className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-2.5 text-sm">
              <dt className="text-muted-foreground">근무지</dt>
              <dd>{posting.location ?? "—"}</dd>
              <dt className="text-muted-foreground">근무 형태</dt>
              <dd>{posting.employmentType ?? "—"}</dd>
              <dt className="text-muted-foreground">기업 규모</dt>
              <dd>{posting.companySize ?? "—"}</dd>
              <dt className="text-muted-foreground">제출 서류</dt>
              <dd>{posting.requiredDocs.join(", ") || "—"}</dd>
              <dt className="text-muted-foreground">원본</dt>
              <dd className="min-w-0">
                {posting.sourceUrl ? (
                  <a href={posting.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 underline underline-offset-2">
                    <span className="truncate">{posting.sourceUrl}</span>
                    <ExternalLink className="size-3.5 shrink-0" />
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </dl>
          </Section>
          <Separator />

          {/* 수정 · 삭제 */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="lg" className="px-3" onClick={() => setEditing(true)}>
              <Pencil data-icon="inline-start" />
              수정
            </Button>
            {confirmDelete ? (
              <div className="flex items-center gap-2" role="alert">
                <span className="text-sm">정말 지울까요?</span>
                <Button variant="destructive" size="lg" className="px-3" onClick={remove} disabled={deleting}>{deleting ? "지우는 중…" : "지우기"}</Button>
                <Button variant="ghost" size="lg" className="px-3" onClick={() => setConfirmDelete(false)}>취소</Button>
              </div>
            ) : (
              <Button variant="destructive" size="lg" className="px-3" onClick={() => setConfirmDelete(true)}>
                <Trash2 data-icon="inline-start" />
                삭제
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
