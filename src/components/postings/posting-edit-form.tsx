"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker, TimePicker } from "@/components/date-time-picker";
import { Label } from "@/components/ui/label";
import { DocPicker, StepEditor, type StepItem } from "@/components/postings/posting-field-editors";
import { Segmented } from "@/components/postings/segmented";
import { arrangeSteps, type DeadlineKind, type Posting } from "@/lib/postings";

// 공고 고치기: 기본 정보 + 제출 서류 + 전형 절차 (D-48). 공고 상세와 목록의 [편집] 창에서 함께 쓴다

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

export function PostingEditForm({
  posting,
  onSave,
  onCancel,
  formId,
}: {
  formId?: string; // 있으면 [취소·저장] 은 바깥(공고 제목 옆)에 두고 폼 아래에서는 뺀다 (2026-11-12)
  posting: Posting;
  onSave: (p: Posting) => Promise<string | null>; // 실패하면 안내 문구, 성공하면 null
  onCancel: () => void;
}) {
  const initial = kstParts(posting.deadlineAt, posting.deadlineTimeKnown);
  const [company, setCompany] = useState(posting.company);
  const [jobTitle, setJobTitle] = useState(posting.jobTitle);
  const [deadlineKind, setDeadlineKind] = useState<DeadlineKind>(posting.deadlineKind);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [location, setLocation] = useState(posting.location ?? "");
  const [employmentType, setEmploymentType] = useState(posting.employmentType ?? "");
  const [companySize, setCompanySize] = useState(posting.companySize ?? "");
  const [docs, setDocs] = useState(posting.requiredDocs);
  const [steps, setSteps] = useState<StepItem[]>(posting.steps.map((step) => ({ id: step.id, name: step.name })));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !jobTitle.trim()) return setError("기업명과 직무를 채워 주세요.");
    if (deadlineKind === "date" && !date) return setError("마감 날짜를 골라 주세요.");
    if (steps.length === 0) return setError("전형 단계를 하나 이상 넣어 주세요.");
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
      requiredDocs: docs,
      steps: arrangeSteps(posting.steps, steps),
    });
    setSaving(false);
    setError(problem);
  }

  return (
    <form id={formId} onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`edit-company-${posting.id}`}>기업명</Label>
          <Input id={`edit-company-${posting.id}`} value={company} maxLength={100} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`edit-job-${posting.id}`}>직무</Label>
          <Input id={`edit-job-${posting.id}`} value={jobTitle} maxLength={100} onChange={(e) => setJobTitle(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>마감일</Label>
        <Segmented label="마감 방식" value={deadlineKind} onChange={setDeadlineKind} options={DEADLINE_KINDS} />
        {deadlineKind === "date" && (
          <div className="grid grid-cols-2 gap-2">
            <DatePicker aria-label="마감 날짜" value={date} onChange={setDate} />
            <TimePicker aria-label="마감 시각" value={time} onChange={setTime} />
          </div>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`edit-location-${posting.id}`}>근무지</Label>
          <Input id={`edit-location-${posting.id}`} value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`edit-type-${posting.id}`}>근무 형태</Label>
          <Input id={`edit-type-${posting.id}`} value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`edit-size-${posting.id}`}>기업 규모</Label>
          <Input id={`edit-size-${posting.id}`} value={companySize} onChange={(e) => setCompanySize(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>제출 서류</Label>
        <DocPicker value={docs} onChange={setDocs} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>전형 절차</Label>
        <p className="text-xs text-muted-foreground">손잡이를 잡고 끌거나 화살표로 순서를 바꿔요. 지금 진행 중인 단계는 그대로 유지돼요.</p>
        <StepEditor items={steps} onChange={setSteps} />
      </div>
      {error && <p className="rounded-2xl bg-destructive-soft px-4 py-3 text-sm text-destructive" role="alert">{error}</p>}
      {!formId && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="lg" onClick={onCancel}>취소</Button>
          <Button type="submit" size="lg" className="px-6" disabled={saving}>{saving ? "저장 중…" : "저장"}</Button>
        </div>
      )}
    </form>
  );
}
