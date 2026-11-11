"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronDown, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocPicker, newStepItem, StepEditor, type StepItem } from "@/components/postings/posting-field-editors";
import { Segmented } from "@/components/postings/segmented";
import { cn } from "@/lib/utils";
import type { DeadlineKind } from "@/lib/postings";
import { createPosting, findSimilarPostings, type PostingSummary } from "@/lib/posting-actions";
import { clearDraft, loadDraft, type Draft } from "@/lib/practice-store";

// 공고에서 전형 절차를 못 읽었을 때 쓰는 기본 단계 (DB.md 4번)
const DEFAULT_STEPS = ["서류 제출", "서류 결과", "면접", "최종 결과"];

const DEADLINE_KINDS: { value: DeadlineKind; label: string }[] = [
  { value: "date", label: "날짜" },
  { value: "rolling", label: "상시" },
  { value: "until_filled", label: "채용 시 마감" },
];

// ISO 시각 → 한국 시간 날짜(YYYY-MM-DD)·시각(HH:mm)
function toKstParts(iso: string | null, timeKnown: boolean) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
  return { date, time: timeKnown ? time : "" };
}

function Field({
  label,
  htmlFor,
  unsure,
  children,
}: {
  label: string;
  htmlFor?: string;
  unsure?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-2xl", unsure && "-mx-2 bg-warning/70 px-2 py-2.5")}>
      <div className="flex items-center justify-between gap-2 px-1">
        <Label htmlFor={htmlFor} className="text-sm font-medium">{label}</Label>
        {unsure && (
          <span className="flex items-center gap-1 rounded-xs bg-card px-1.5 py-0.5 text-[11px] font-medium text-warning-foreground">
            <AlertCircle className="size-3" />
            확인해 주세요
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// 판 하나: 제목 + 내용 (DESIGN.md 4 "판")
function Panel({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="gap-5 px-4 md:px-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {aside}
      </div>
      {children}
    </Card>
  );
}

const SOURCE_LABEL = { link: "링크", text: "붙여넣은 글", image: "캡처" } as const;

function ReviewFormInner({ draft }: { draft: Draft }) {
  const router = useRouter();
  const p = draft.posting;
  const initialDeadline = toKstParts(p.deadlineAt, p.deadlineTimeKnown);
  const usedDefaultSteps = p.steps.length === 0;

  const [company, setCompany] = useState(p.company);
  const [jobTitle, setJobTitle] = useState(p.jobTitle);
  const [deadlineKind, setDeadlineKind] = useState<DeadlineKind | null>(p.deadlineKind);
  const [date, setDate] = useState(initialDeadline.date);
  const [time, setTime] = useState(initialDeadline.time);
  const [location, setLocation] = useState(p.location ?? "");
  const [employmentType, setEmploymentType] = useState(p.employmentType ?? "");
  const [companySize, setCompanySize] = useState(p.companySize ?? "");
  const [docs, setDocs] = useState(p.requiredDocs);
  const [steps, setSteps] = useState<StepItem[]>(() => (usedDefaultSteps ? DEFAULT_STEPS : p.steps).map(newStepItem));
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [saving, startSaving] = useTransition();
  // 비슷한 공고 경고: 어떤 값으로 확인했는지(key)와 찾은 공고
  const [similar, setSimilar] = useState<{ key: string; items: PostingSummary[] } | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const similarKey = `${company.trim()}|${jobTitle.trim()}|${deadlineKind}|${deadlineKind === "date" ? date : ""}`;
  const showSimilar = similar !== null && similar.key === similarKey;
  const similarRef = useRef<HTMLDivElement>(null);

  // 경고가 뜨면 보이는 곳으로 옮긴다 (휴대폰에서는 폼 아래쪽이라 안 보일 수 있다)
  useEffect(() => {
    if (similar) similarRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [similar]);

  const jobOptions = p.jobOptions ?? [];
  // 여러 직무 공고는 고르거나 고칠 때까지 직무 칸을 확인 칸으로 둔다 (D-43)
  const isUnsure = (key: string) => (p.unsure.includes(key) || (key === "jobTitle" && jobOptions.length >= 2)) && !touched.has(key);
  const touch = (key: string) => setTouched((prev) => new Set(prev).add(key));

  function save() {
    if (!company.trim() || !jobTitle.trim()) return setError("기업명과 직무를 채워 주세요.");
    if (!deadlineKind) return setError("마감일을 골라 주세요. 상시 모집이면 '상시'를 고르면 돼요.");
    if (deadlineKind === "date" && !date) return setError("마감 날짜를 골라 주세요.");
    if (steps.length === 0) return setError("전형 단계를 하나 이상 넣어 주세요.");

    setError(null);
    setExistingId(null);
    // 시각이 없으면 그날 23:59 (한국 시간)로 저장하고 화면에는 날짜만 보여 준다
    const deadlineAt = deadlineKind === "date" ? new Date(`${date}T${time || "23:59"}:00+09:00`).toISOString() : null;
    startSaving(async () => {
      // 처음 누르면 비슷한 공고를 찾아 경고만 하고, 한 번 더 누르면 그대로 저장한다 (T-08)
      if (!showSimilar) {
        const items = await findSimilarPostings({ company, jobTitle, deadlineKind, deadlineAt });
        if (items.length > 0) return setSimilar({ key: similarKey, items });
      }
      const result = await createPosting({
        company,
        jobTitle,
        deadlineKind,
        deadlineAt,
        deadlineTimeKnown: deadlineKind === "date" && time !== "",
        location,
        employmentType,
        companySize,
        requiredDocs: docs,
        steps: steps.map((step) => step.name),
        sourceKind: draft.source.kind,
        sourceUrl: draft.source.url ?? null,
        sourceText: draft.source.kind === "text" ? draft.source.text : null,
        aiRaw: { ...draft.posting, jobOptions: undefined }, // 직무 후보는 저장하지 않는다 (D-43)
      });
      if (!result.ok) {
        setError(result.message);
        setExistingId(result.existingId ?? null);
        return;
      }
      clearDraft();
      router.push(`/app/postings?saved=${result.id}`);
    });
  }

  const unsureCount = ["company", "jobTitle", "deadline", "location", "employmentType", "companySize", "requiredDocs", "steps"].filter(isUnsure).length;

  return (
    <form
      className="flex flex-col gap-4 pb-28"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      {/* 머리: 무엇을 정리했는지 한눈에 */}
      <Card className="gap-4 px-4 md:px-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{draft.source.kind === "link" && draft.source.viaExtension ? "확장 프로그램" : SOURCE_LABEL[draft.source.kind]}에서 정리</Badge>
          {unsureCount > 0 ? (
            <Badge variant="warning">확인할 칸 {unsureCount}개</Badge>
          ) : (
            <Badge variant="success">모든 칸을 채웠어요</Badge>
          )}
          {draft.isExample && <Badge variant="warning">연습용 예시</Badge>}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xl font-bold tracking-tight md:text-2xl">{company || "기업명 없음"}</p>
          <p className="truncate text-sm text-muted-foreground">{jobTitle || "직무 없음"}</p>
        </div>
        {draft.hint && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-info px-4 py-3 text-sm text-info-foreground" role="status">
            <p className="min-w-0 flex-1">{draft.hint}</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/new">캡처 올리기</Link>
            </Button>
          </div>
        )}
        {/* 원본: 접어 둔다 */}
        <div className="rounded-2xl bg-muted">
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-2.5 text-sm"
            onClick={() => setShowSource((v) => !v)}
            aria-expanded={showSource}
          >
            <span className="font-medium">원본 보기</span>
            <ChevronDown className={cn("size-4 transition-transform", showSource && "rotate-180")} />
          </button>
          {showSource && (
            <div className="px-4 pb-3 text-sm">
              {draft.source.url && (
                <a href={draft.source.url} target="_blank" rel="noreferrer" className="mb-3 inline-flex max-w-full items-center gap-1 break-all underline underline-offset-2">
                  {draft.source.url}
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              )}
              {draft.source.kind === "text" && (
                <>
                  <p className="mb-2 text-xs text-muted-foreground">[저장]하면 이 글도 원문으로 함께 저장돼요. 나만 볼 수 있어요.</p>
                  <p className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl bg-card p-3 text-sm leading-relaxed">{draft.source.text}</p>
                </>
              )}
              {draft.source.kind === "image" && (
                // 기기 안에서만 보여 주는 미리보기
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.source.previewDataUrl} alt="올린 캡처" className="mx-auto max-h-96 w-auto rounded-xl" />
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="기본 정보">
            <Field label="기업명" htmlFor="company" unsure={isUnsure("company")}>
              <Input id="company" value={company} maxLength={100}
                onChange={(e) => { setCompany(e.target.value); touch("company"); }} />
            </Field>
            <Field label="직무" htmlFor="jobTitle" unsure={isUnsure("jobTitle")}>
              {jobOptions.length >= 2 && (
                <div className="flex flex-col gap-2 px-1">
                  <p className="text-xs text-muted-foreground">여러 직무를 모집하는 공고예요. 지원할 직무를 골라 주세요.</p>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="지원할 직무">
                    {jobOptions.map((name) => (
                      <Button
                        key={name}
                        type="button"
                        variant="outline"
                        size="sm"
                        role="radio"
                        aria-checked={jobTitle === name}
                        className={cn("h-auto whitespace-normal py-1.5 text-left", jobTitle === name && "border-foreground bg-foreground text-background hover:bg-foreground/85 hover:text-background")}
                        onClick={() => { setJobTitle(name); touch("jobTitle"); }}
                      >
                        {name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <Input id="jobTitle" value={jobTitle} maxLength={100}
                onChange={(e) => { setJobTitle(e.target.value); touch("jobTitle"); }} />
            </Field>
            <Field label="마감일" unsure={isUnsure("deadline")}>
              <Segmented
                label="마감 방식"
                value={deadlineKind ?? ("" as DeadlineKind)}
                onChange={(v) => { setDeadlineKind(v); touch("deadline"); }}
                options={DEADLINE_KINDS}
                className={cn(isUnsure("deadline") && "bg-card")}
              />
              {deadlineKind === "date" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" aria-label="마감 날짜" className={cn(isUnsure("deadline") && "bg-card")} value={date}
                      onChange={(e) => { setDate(e.target.value); touch("deadline"); }} />
                    <Input type="time" aria-label="마감 시각 (없으면 비워 두기)" className={cn(isUnsure("deadline") && "bg-card")} value={time}
                      onChange={(e) => setTime(e.target.value)} />
                  </div>
                  <p className="px-1 text-xs text-muted-foreground">시각이 없으면 비워 두세요. 그날 23:59로 저장해요.</p>
                </>
              )}
            </Field>
          </Panel>

          <Panel title="근무 조건">
            <Field label="근무지" htmlFor="location" unsure={isUnsure("location")}>
              <Input id="location" value={location} onChange={(e) => { setLocation(e.target.value); touch("location"); }} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="근무 형태" htmlFor="employmentType" unsure={isUnsure("employmentType")}>
                <Input id="employmentType" value={employmentType} onChange={(e) => { setEmploymentType(e.target.value); touch("employmentType"); }} />
              </Field>
              <Field label="기업 규모" htmlFor="companySize" unsure={isUnsure("companySize")}>
                <Input id="companySize" value={companySize} placeholder="예: 스타트업" onChange={(e) => { setCompanySize(e.target.value); touch("companySize"); }} />
              </Field>
            </div>
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="제출 서류" aside={<span className="text-xs text-muted-foreground tabular-nums">{docs.length}개 선택</span>}>
            <Field label="눌러서 고르기" unsure={isUnsure("requiredDocs")}>
              <DocPicker value={docs} onChange={(next) => { setDocs(next); touch("requiredDocs"); }} />
            </Field>
          </Panel>

          <Panel title="전형 절차" aside={<span className="text-xs text-muted-foreground tabular-nums">{steps.length}단계</span>}>
            <Field label="순서대로" unsure={isUnsure("steps")}>
              {usedDefaultSteps && !touched.has("steps") && (
                <p className="px-1 text-xs text-muted-foreground">공고에서 절차를 못 읽어서 기본 단계로 채웠어요.</p>
              )}
              <StepEditor items={steps} onChange={(next) => { setSteps(next); touch("steps"); }} />
            </Field>
          </Panel>
        </div>
      </div>

      {error && (
        <p className="rounded-2xl bg-destructive-soft px-4 py-3 text-sm text-destructive" role="alert">
          {error}
          {existingId && (
            <Link href={`/app/postings/${existingId}`} className="ml-2 font-medium underline underline-offset-2">
              그 공고 보기
            </Link>
          )}
        </p>
      )}

      {showSimilar && (
        <div ref={similarRef} className="flex flex-col gap-2 rounded-2xl bg-warning px-4 py-3 text-sm text-warning-foreground" role="alert">
          <p className="font-semibold">비슷한 공고가 있어요</p>
          <p>기업명 · 직무 · 마감일이 같은 공고가 이미 있어요. 다른 공고라면 [그래도 저장]을 눌러 주세요.</p>
          <ul className="flex flex-col gap-1">
            {similar.items.map((item) => (
              <li key={item.id}>
                <Link href={`/app/postings/${item.id}`} className="underline underline-offset-2">
                  {item.company} · {item.jobTitle}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 화면 아래 떠 있는 저장 바 */}
      <div className="sticky bottom-4 z-10 mx-auto flex w-full max-w-md gap-2 rounded-2xl bg-card p-2 shadow-soft ring-1 ring-border">
        <Button type="button" variant="ghost" size="lg" className="h-11 px-4" asChild>
          <Link href="/app/new">처음부터</Link>
        </Button>
        <Button type="submit" size="lg" className="h-11 flex-1" disabled={saving}>
          {saving ? "저장 중…" : showSimilar ? "그래도 저장" : "저장"}
        </Button>
      </div>
    </form>
  );
}

// 한 줄 입력 + [+] (Enter 로도 추가)
export function ReviewForm() {
  // 정리 결과는 이 탭 안에만 있으므로 브라우저에서 읽는다
  const [draft, setDraft] = useState<Draft | null | undefined>(undefined);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 저장소는 화면을 그린 뒤에만 읽을 수 있다
    setDraft(loadDraft());
  }, []);

  if (draft === undefined) return <div className="h-96 animate-pulse rounded-2xl bg-card" aria-label="불러오는 중" />;
  if (draft === null) {
    return (
      <Card className="items-start px-6">
        <p className="font-semibold">확인할 공고가 없어요</p>
        <p className="text-sm text-muted-foreground">공고 넣기에서 링크나 글을 넣고 정리하면 여기에서 확인할 수 있어요.</p>
        <Button size="lg" className="px-4" asChild>
          <Link href="/app/new">공고 넣기</Link>
        </Button>
      </Card>
    );
  }
  // 화면을 떠나도 Next 가 이 화면을 숨겨 두기만 해서(Activity) 이전 결과가 남는다 → 새 정리 결과면 처음부터 다시 그린다
  return <ReviewFormInner key={draft.id ?? "draft"} draft={draft} />;
}
