"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { PostingCard } from "@/components/postings/posting-card";
import { currentStepIndex, daysLeftFor, type Posting } from "@/lib/postings";
import { setStepCompleted as setStepCompletedAction } from "@/lib/posting-actions";

type Section = { title: string; postings: Posting[] };

// 마감 임박(D-3 이내) · 마감 전 · 진행 중(지원함) · 지난 공고(접힘)
function groupPostings(postings: Posting[], daysLeft: Record<string, number | null>) {
  const urgent: Posting[] = [];
  const upcoming: Posting[] = [];
  const inProgress: Posting[] = [];
  const past: Posting[] = [];

  for (const posting of postings) {
    const days = daysLeft[posting.id];
    const applied = posting.steps[0]?.completedAt !== null;
    const finished = currentStepIndex(posting.steps) === -1;
    if (finished || (!applied && days !== null && days < 0)) past.push(posting);
    else if (applied) inProgress.push(posting);
    else if (days !== null && days <= 3) urgent.push(posting);
    else upcoming.push(posting);
  }

  // 마감이 빠른 순, 날짜 없는 공고(상시·채용 시 마감)는 뒤로
  const byDeadline = (a: Posting, b: Posting) =>
    (daysLeft[a.id] ?? Infinity) - (daysLeft[b.id] ?? Infinity);

  const sections: Section[] = [
    { title: "마감 임박", postings: urgent.sort(byDeadline) },
    { title: "마감 전", postings: upcoming.sort(byDeadline) },
    { title: "진행 중", postings: inProgress.sort(byDeadline) },
  ];
  return { sections: sections.filter((s) => s.postings.length > 0), past };
}

export function PostingList({
  initialPostings,
  daysLeft,
}: {
  initialPostings: Posting[];
  daysLeft: Record<string, number | null>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [postings, setPostings] = useState(initialPostings);
  // 처음 그릴 때는 서버가 센 D-day, 그 뒤에는 브라우저에서 센다
  const [now, setNow] = useState<Date | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  // 확인 화면에서 방금 저장한 공고(?saved=번호)를 알리고 잠깐 강조한다
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 지금 시각은 브라우저에서 화면을 그린 뒤에 센다
    setNow(new Date());
    const justSaved = searchParams.get("saved");
    if (!justSaved) return;
    setHighlightId(justSaved);
    toast("저장했어요", { id: `saved-${justSaved}` });
    router.replace("/app", { scroll: false });
    const timer = setTimeout(() => setHighlightId(null), 3000);
    return () => clearTimeout(timer);
  }, [searchParams, router]);

  function setStepCompleted(postingId: string, stepIndex: number, completedAt: string | null) {
    setPostings((prev) =>
      prev.map((p) =>
        p.id !== postingId
          ? p
          : { ...p, steps: p.steps.map((s, i) => (i === stepIndex ? { ...s, completedAt } : s)) },
      ),
    );
  }

  // 화면을 먼저 바꾸고 DB 에 저장한다. 실패하면 되돌린다.
  async function saveStep(posting: Posting, stepIndex: number, completed: boolean) {
    const previous = posting.steps[stepIndex].completedAt;
    setStepCompleted(posting.id, stepIndex, completed ? new Date().toISOString() : null);
    const result = await setStepCompletedAction(posting.steps[stepIndex].id, completed);
    if (!result.ok) {
      setStepCompleted(posting.id, stepIndex, previous);
      toast.error(result.message);
    }
    return result.ok;
  }

  async function handleComplete(posting: Posting, stepIndex: number) {
    if (!(await saveStep(posting, stepIndex, true))) return;
    toast(`${posting.company} · ${posting.steps[stepIndex].name} 완료`, {
      action: { label: "되돌리기", onClick: () => saveStep(posting, stepIndex, false) },
    });
  }

  const allDaysLeft = now
    ? Object.fromEntries(postings.map((p) => [p.id, daysLeftFor(p, now)]))
    : daysLeft;
  const { sections, past } = groupPostings(postings, allDaysLeft);

  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-3">
          <h2 className="text-[13px] font-semibold text-muted-foreground">
            {section.title} <span className="tabular-nums">{section.postings.length}</span>
          </h2>
          {section.postings.map((posting) => (
            <PostingCard
              key={posting.id}
              posting={posting}
              daysLeft={allDaysLeft[posting.id] ?? null}
              highlight={posting.id === highlightId}
              onComplete={handleComplete}
            />
          ))}
        </section>
      ))}

      {past.length > 0 && (
        <section className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="flex items-center gap-1 self-start text-[13px] font-semibold text-muted-foreground hover:text-foreground"
            aria-expanded={showPast}
          >
            <ChevronDown className={showPast ? "size-4 rotate-180 transition-transform" : "size-4 transition-transform"} />
            지난 공고 <span className="tabular-nums">{past.length}</span>
          </button>
          {showPast &&
            past.map((posting) => (
              <PostingCard
                key={posting.id}
                posting={posting}
                daysLeft={allDaysLeft[posting.id] ?? null}
                highlight={posting.id === highlightId}
                onComplete={handleComplete}
              />
            ))}
        </section>
      )}
    </div>
  );
}
