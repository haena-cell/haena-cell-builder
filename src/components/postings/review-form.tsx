"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronDown, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { DeadlineKind } from "@/lib/postings";
import { createPosting } from "@/lib/posting-actions";
import { clearDraft, loadDraft, type Draft } from "@/lib/practice-store";

// 공고에서 전형 절차를 못 읽었을 때 쓰는 기본 단계 (DB.md 4번)
const DEFAULT_STEPS = ["서류 제출", "서류 결과", "면접", "최종 결과"];
const DEFAULT_DOCS = ["이력서", "포트폴리오", "과제", "자기소개서"];

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
    <div className={cn("flex flex-col gap-1.5 rounded-lg", unsure && "-mx-2 bg-warning px-2 py-2")}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {unsure && <span className="text-xs font-medium text-warning-foreground">확인해 주세요</span>}
      </div>
      {children}
    </div>
  );
}

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
  const [docOptions, setDocOptions] = useState(() => [...new Set([...DEFAULT_DOCS, ...p.requiredDocs])]);
  const [docs, setDocs] = useState(p.requiredDocs);
  const [newDoc, setNewDoc] = useState("");
  const [steps, setSteps] = useState(usedDefaultSteps ? DEFAULT_STEPS : p.steps);
  const [newStep, setNewStep] = useState("");
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [saving, startSaving] = useTransition();

  const isUnsure = (key: string) => p.unsure.includes(key) && !touched.has(key);
  const touch = (key: string) => setTouched((prev) => new Set(prev).add(key));

  function toggleDoc(doc: string) {
    setDocs((prev) => (prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]));
    touch("requiredDocs");
  }

  function addDoc() {
    const doc = newDoc.trim();
    if (!doc) return;
    setDocOptions((prev) => (prev.includes(doc) ? prev : [...prev, doc]));
    setDocs((prev) => (prev.includes(doc) ? prev : [...prev, doc]));
    setNewDoc("");
  }

  function moveStep(i: number, dir: -1 | 1) {
    setSteps((prev) => {
      const next = [...prev];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
    touch("steps");
  }

  function addStep() {
    const step = newStep.trim();
    if (!step) return;
    setSteps((prev) => [...prev, step]);
    setNewStep("");
    touch("steps");
  }

  function save() {
    if (!company.trim() || !jobTitle.trim()) return setError("기업명과 직무를 채워 주세요.");
    if (!deadlineKind) return setError("마감일을 골라 주세요. 상시 모집이면 '상시'를 고르면 돼요.");
    if (deadlineKind === "date" && !date) return setError("마감 날짜를 골라 주세요.");
    if (steps.length === 0) return setError("전형 단계를 하나 이상 넣어 주세요.");

    setError(null);
    startSaving(async () => {
      const result = await createPosting({
        company,
        jobTitle,
        deadlineKind,
        // 시각이 없으면 그날 23:59 (한국 시간)로 저장하고 화면에는 날짜만 보여 준다
        deadlineAt: deadlineKind === "date" ? new Date(`${date}T${time || "23:59"}:00+09:00`).toISOString() : null,
        deadlineTimeKnown: deadlineKind === "date" && time !== "",
        location,
        employmentType,
        companySize,
        requiredDocs: docs,
        steps,
        sourceKind: draft.source.kind,
        sourceUrl: draft.source.kind === "link" ? draft.source.url : null,
        aiRaw: draft.posting,
      });
      if (!result.ok) return setError(result.message);
      clearDraft();
      router.push(`/app?saved=${result.id}`);
    });
  }

  return (
    <div className="flex flex-col gap-6 pb-24 md:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">AI가 정리했어요</h1>
          <p className="mt-1 text-sm text-muted-foreground">틀린 칸만 고쳐 주세요. 노란 칸은 꼭 확인해 주세요.</p>
        </div>
        {draft.isExample && <Badge className="shrink-0 bg-warning text-warning-foreground">연습용 예시</Badge>}
      </div>

      {/* 원본 미리보기: 휴대폰은 접어 둔다 */}
      <section className="rounded-lg border border-border">
        <button
          type="button"
          className="flex w-full items-center justify-between px-3 py-2.5 text-sm md:pointer-events-none"
          onClick={() => setShowSource((v) => !v)}
          aria-expanded={showSource}
        >
          <span className="font-medium">원본 보기</span>
          <ChevronDown className={cn("size-4 transition-transform md:hidden", showSource && "rotate-180")} />
        </button>
        <div className={cn("border-t border-border px-3 py-3 text-sm", !showSource && "hidden md:block")}>
          {draft.source.kind === "link" && (
            <a href={draft.source.url} target="_blank" rel="noreferrer" className="break-all underline underline-offset-2">
              {draft.source.url}
            </a>
          )}
          {draft.source.kind === "text" && <p className="text-muted-foreground">붙여넣은 글 (저장하지 않아요)</p>}
          {draft.source.kind === "image" && (
            // 기기 안에서만 보여 주는 미리보기
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.source.previewDataUrl} alt="올린 캡처" className="mx-auto max-h-96 w-auto rounded-md" />
          )}
        </div>
      </section>

      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="기업명" htmlFor="company" unsure={isUnsure("company")}>
          <Input id="company" className="h-10" value={company} maxLength={100}
            onChange={(e) => { setCompany(e.target.value); touch("company"); }} />
        </Field>
        <Field label="직무" htmlFor="jobTitle" unsure={isUnsure("jobTitle")}>
          <Input id="jobTitle" className="h-10" value={jobTitle} maxLength={100}
            onChange={(e) => { setJobTitle(e.target.value); touch("jobTitle"); }} />
        </Field>

        <Field label="마감일" unsure={isUnsure("deadline")}>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="마감 방식">
            {DEADLINE_KINDS.map((k) => (
              <Button key={k.value} type="button" variant="outline" size="lg" role="radio"
                aria-checked={deadlineKind === k.value}
                className={cn("bg-background", deadlineKind === k.value && "border-primary bg-muted font-semibold")}
                onClick={() => { setDeadlineKind(k.value); touch("deadline"); }}>
                {k.label}
              </Button>
            ))}
          </div>
          {deadlineKind === "date" && (
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" aria-label="마감 날짜" className="h-10 bg-background" value={date}
                onChange={(e) => { setDate(e.target.value); touch("deadline"); }} />
              <Input type="time" aria-label="마감 시각 (없으면 비워 두기)" className="h-10 bg-background" value={time}
                onChange={(e) => setTime(e.target.value)} />
            </div>
          )}
          {deadlineKind === "date" && <p className="text-xs text-muted-foreground">시각이 없으면 비워 두세요. 그날 23:59로 저장해요.</p>}
        </Field>

        <div className="grid gap-5 md:grid-cols-3">
          <Field label="근무지" htmlFor="location" unsure={isUnsure("location")}>
            <Input id="location" className="h-10" value={location} onChange={(e) => { setLocation(e.target.value); touch("location"); }} />
          </Field>
          <Field label="근무 형태" htmlFor="employmentType" unsure={isUnsure("employmentType")}>
            <Input id="employmentType" className="h-10" value={employmentType} onChange={(e) => { setEmploymentType(e.target.value); touch("employmentType"); }} />
          </Field>
          <Field label="기업 규모" htmlFor="companySize" unsure={isUnsure("companySize")}>
            <Input id="companySize" className="h-10" value={companySize} onChange={(e) => { setCompanySize(e.target.value); touch("companySize"); }} />
          </Field>
        </div>

        <Field label="제출 서류" unsure={isUnsure("requiredDocs")}>
          <div className="flex flex-wrap gap-2">
            {docOptions.map((doc) => (
              <Button key={doc} type="button" variant="outline" size="sm" aria-pressed={docs.includes(doc)}
                className={cn("bg-background", docs.includes(doc) && "border-primary bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground")}
                onClick={() => toggleDoc(doc)}>
                {doc}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="다른 서류 추가" className="h-9 bg-background" value={newDoc} maxLength={50}
              onChange={(e) => setNewDoc(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDoc(); } }} />
            <Button type="button" variant="outline" size="lg" onClick={addDoc} aria-label="서류 추가"><Plus /></Button>
          </div>
        </Field>

        <Field label="전형 절차" unsure={isUnsure("steps")}>
          {usedDefaultSteps && !touched.has("steps") && (
            <p className="text-xs text-muted-foreground">공고에서 절차를 못 읽어서 기본 단계로 채웠어요.</p>
          )}
          <ol className="flex flex-col gap-1.5">
            {steps.map((step, i) => (
              <li key={`${step}-${i}`} className="flex items-center gap-2 rounded-md border border-border bg-background py-1 pr-1 pl-3 text-sm">
                <span className="w-4 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                <span className="flex-1 truncate">{step}</span>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`${step} 위로`} disabled={i === 0} onClick={() => moveStep(i, -1)}><ArrowUp /></Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`${step} 아래로`} disabled={i === steps.length - 1} onClick={() => moveStep(i, 1)}><ArrowDown /></Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`${step} 빼기`}
                  onClick={() => { setSteps((prev) => prev.filter((_, j) => j !== i)); touch("steps"); }}><X /></Button>
              </li>
            ))}
          </ol>
          <div className="flex gap-2">
            <Input placeholder="단계 추가 (예: 2차 면접)" className="h-9 bg-background" value={newStep} maxLength={50}
              onChange={(e) => setNewStep(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStep(); } }} />
            <Button type="button" variant="outline" size="lg" onClick={addStep} aria-label="단계 추가"><Plus /></Button>
          </div>
        </Field>

        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

        {/* 휴대폰: [저장] 화면 아래 고정 */}
        <div className="fixed inset-x-0 bottom-0 z-10 flex gap-2 border-t border-border bg-background p-4 md:static md:border-0 md:p-0">
          <Button type="button" variant="outline" size="lg" className="h-11 px-4" asChild>
            <Link href="/app/new">처음부터</Link>
          </Button>
          <Button type="submit" size="lg" className="h-11 flex-1 md:flex-none md:px-8" disabled={saving}>
            {saving ? "저장 중…" : "저장"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function ReviewForm() {
  // 정리 결과는 이 탭 안에만 있으므로 브라우저에서 읽는다
  const [draft, setDraft] = useState<Draft | null | undefined>(undefined);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 저장소는 화면을 그린 뒤에만 읽을 수 있다
    setDraft(loadDraft());
  }, []);

  if (draft === undefined) return <div className="h-96 animate-pulse rounded-xl bg-muted" aria-label="불러오는 중" />;
  if (draft === null) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-border p-6">
        <p className="font-semibold">확인할 공고가 없어요</p>
        <p className="text-sm text-muted-foreground">공고 넣기에서 링크나 글을 넣고 정리하면 여기에서 확인할 수 있어요.</p>
        <Button size="lg" className="px-4" asChild>
          <Link href="/app/new">공고 넣기</Link>
        </Button>
      </div>
    );
  }
  return <ReviewFormInner draft={draft} />;
}
