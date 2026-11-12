"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, ChevronDown, Download, ExternalLink, Pencil, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { pushUndo } from "@/lib/undo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppHref, usePostingActions } from "@/components/postings/demo-context";
import { PageTitle } from "@/components/postings/page-title";
import { DeadlineWeek } from "@/components/postings/deadline-week";
import { DeadlineBadge } from "@/components/postings/posting-card";
import { PostingEditForm } from "@/components/postings/posting-edit-form";
import { PrepTodos } from "@/components/postings/prep-todos";
import { StepBar, StepDoneButton } from "@/components/postings/step-bar";
import { canAddToCalendar, googleCalendarUrl, icsFile } from "@/lib/calendar";
import {
  currentStepIndex,
  daysLeftFor,
  formatDeadline,
  kstDateKey,
  withCurrentStep,
  type Posting,
} from "@/lib/postings";
import { cn } from "@/lib/utils";
import { stepDoneToast } from "@/components/postings/step-done-toast";

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <Card className="gap-4 px-4 md:px-6" aria-label={title}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {aside}
      </div>
      {children}
    </Card>
  );
}

// 제목 옆 [저장] 이 공고 수정 폼을 제출한다
const EDIT_FORM_ID = "posting-edit-form";

// 다른 공고의 마감일: 상세의 마감 주 달력에 함께 보여 준다 (2026-11-12)
export type OtherPostingDeadline = { id: string; company: string; date: string };

export function PostingDetail({
  initialPosting,
  nowIso,
  otherDeadlines = [],
}: {
  initialPosting: Posting;
  nowIso: string;
  otherDeadlines?: OtherPostingDeadline[];
}) {
  const router = useRouter();
  const href = useAppHref();
  const { deletePosting, setCurrentStep, setStepCompleted: setStepCompletedAction, updatePostingFull } = usePostingActions();
  const [posting, setPosting] = useState(initialPosting);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pickedStep, setPickedStep] = useState<number | null>(null); // 단계 직접 고르기에서 고른 단계 (저장 전)
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
    stepDoneToast({
      label: posting.steps[stepIndex].name,
      isLast: stepIndex === posting.steps.length - 1,
      undo: () => saveStep(stepIndex, false),
    });
  }

  // 현재 단계 바꾸기: [이전 단계로] 또는 단계를 직접 골라서
  async function moveToStep(target: number, record = true) {
    const from = currentStepIndex(posting.steps);
    const ok = await optimistic(
      (p) => ({ ...p, steps: withCurrentStep(p.steps, target) }),
      () => setCurrentStep(posting.id, target),
    );
    if (!ok) return;
    toast(`지금 단계: ${posting.steps[target]?.name ?? "전형 끝"}`);
    // Ctrl+Z: 바꾸기 전 단계로 (D-62)
    if (record) pushUndo("단계 바꾸기", () => moveToStep(from === -1 ? posting.steps.length : from, false));
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
    router.push(href("/app/postings"));
  }

  const current = currentStepIndex(posting.steps);
  // 앞에서부터 끝낸 단계 수 = 지금 단계 번호 (모두 끝났으면 단계 수)
  const doneSteps = current === -1 ? posting.steps.length : current;
  const step = current === -1 ? null : posting.steps[current];
  const doneCount = posting.prepItems.filter((item) => item.done).length;
  const googleUrl = googleCalendarUrl(posting);

  return (
    <div className="flex flex-col gap-4">
      {/* 머리 */}
      <PageTitle title={posting.company} description={posting.jobTitle} back={{ href: href("/app/postings"), label: "목록" }}>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {posting.isSample && <Badge variant="warning">연습용 예시</Badge>}
          <DeadlineBadge posting={posting} daysLeft={daysLeftFor(posting, now)} />
          {/* 수정 · 삭제 · 저장은 제목 옆에 (2026-11-12 사용자 요청) */}
          {confirmDelete ? (
            <span className="flex items-center gap-1.5" role="alert">
              <span className="text-sm">정말 지울까요?</span>
              <Button variant="destructive" size="sm" onClick={remove} disabled={deleting}>{deleting ? "지우는 중…" : "지우기"}</Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>취소</Button>
            </span>
          ) : (
            <>
              {editing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>취소</Button>
                  <Button type="submit" form={EDIT_FORM_ID} size="sm">저장</Button>
                </>
              ) : (
                // 수정은 색 없이 회색 (2026-11-12 사용자 요청)
                <Button variant="outline" size="sm" className="text-foreground/80 hover:bg-muted hover:text-foreground aria-expanded:bg-muted" onClick={() => setEditing(true)}>
                  <Pencil data-icon="inline-start" />
                  수정
                </Button>
              )}
              {/* 삭제는 고치는 중에도 보인다 (2026-11-12 사용자 요청) */}
              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 data-icon="inline-start" />
                삭제
              </Button>
            </>
          )}
        </div>
      </PageTitle>

      {editing ? (
        <div className="grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
          <Card className="min-w-0 px-4 md:px-6">
            <PostingEditForm
              formId={EDIT_FORM_ID}
              posting={posting}
              onCancel={() => setEditing(false)}
              onSave={async (next) => {
                const before = posting;
                const result = await updatePostingFull(posting.id, next, next.steps);
                if (!result.ok) return result.message;
                setPosting({ ...next, steps: result.steps });
                setEditing(false);
                toast("고친 내용을 저장했어요");
                // Ctrl+Z: 고치기 전 내용으로 다시 저장 (준비 항목은 그대로) (D-62)
                pushUndo("공고 수정", async () => {
                  const back = await updatePostingFull(before.id, before, before.steps);
                  if (!back.ok) return toast.error(back.message);
                  setPosting((p) => ({ ...before, prepItems: p.prepItems, steps: back.steps }));
                });
                return null;
              }}
            />
          </Card>
          <Section title="준비 항목" aside={<span className="text-xs text-muted-foreground">고치면 바로 저장돼요</span>}>
            <PrepTodos
              postingId={posting.id}
              items={posting.prepItems}
              today={kstDateKey(now)}
              editMode
              onItemsChange={(update) => setPosting((p) => ({ ...p, prepItems: update(p.prepItems) }))}
            />
          </Section>
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-4">
            {/* 전형 단계 */}
            <Section title="전형 단계">
              <StepBar steps={posting.steps} current={current} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm">
                  지금: <span className="font-semibold">{step ? step.name : "전형 끝"}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {doneSteps > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => moveToStep(doneSteps - 1)}>
                      <Undo2 data-icon="inline-start" />
                      이전 단계로
                    </Button>
                  )}
                  {/* 지금 단계 끝내기: 둥근 체크 하나 (2026-11-12) */}
                  {step && <StepDoneButton stepName={step.name} onClick={() => completeStep(current)} className="size-9" />}
                </div>
              </div>
              {pickedStep !== null ? (
                // 단계 직접 고르기: 고른 뒤 [저장] 을 눌러야 바뀐다 (2026-11-12 사용자 요청)
                <div className="flex flex-col gap-2 rounded-2xl bg-muted p-3">
                  <p className="text-xs text-muted-foreground">지금 어느 단계인가요? 앞 단계는 끝낸 것으로 표시돼요.</p>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="지금 단계">
                    {[...posting.steps.map((s) => s.name), "전형 끝"].map((name, i) => (
                      <Button
                        key={`${name}-${i}`}
                        variant="outline"
                        size="sm"
                        role="radio"
                        aria-checked={pickedStep === i}
                        className={cn(pickedStep === i && "border-foreground bg-foreground text-background hover:bg-foreground/85 hover:text-background")}
                        onClick={() => setPickedStep(i)}
                      >
                        {name}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2 self-end">
                    <Button variant="ghost" size="sm" onClick={() => setPickedStep(null)}>취소</Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (pickedStep !== doneSteps) await moveToStep(pickedStep);
                        setPickedStep(null);
                      }}
                    >
                      저장
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="self-start text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  onClick={() => setPickedStep(doneSteps)}
                >
                  단계 직접 고르기
                </button>
              )}
            </Section>

            {/* 마감 */}
            <Section title="마감">
              <p className="text-base font-semibold tabular-nums">{formatDeadline(posting)}</p>
              {posting.deadlineKind === "date" && posting.deadlineAt && (
                <DeadlineWeek
                  deadline={kstDateKey(new Date(posting.deadlineAt))}
                  today={kstDateKey(now)}
                  others={otherDeadlines.map((o) => ({ ...o, href: href(`/app/postings/${o.id}`) }))}
                />
              )}
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
                  ) : posting.sourceText ? (
                    "붙여넣은 글 (아래에서 펼쳐 보기)"
                  ) : (
                    "—"
                  )}
                </dd>
              </dl>
              {posting.sourceText && (
                <details className="group rounded-2xl bg-muted">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm font-medium">
                    붙여넣은 원문 보기
                    <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="max-h-96 overflow-y-auto px-4 pb-4 text-sm leading-relaxed whitespace-pre-wrap">{posting.sourceText}</p>
                </details>
              )}
            </Section>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            {/* 준비 항목 */}
            <Section
              title="준비 항목"
              aside={<span className="text-xs text-muted-foreground tabular-nums">{doneCount}/{posting.prepItems.length}</span>}
            >
              <PrepTodos
                postingId={posting.id}
                items={posting.prepItems}
                today={kstDateKey(now)}
                onItemsChange={(update) => setPosting((p) => ({ ...p, prepItems: update(p.prepItems) }))}
              />
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}
