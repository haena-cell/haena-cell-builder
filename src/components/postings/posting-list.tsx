"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { PostingCard } from "@/components/postings/posting-card";
import { currentStepIndex, daysUntil, type Posting } from "@/lib/postings";
import { loadPracticePostings, takeJustSaved } from "@/lib/practice-store";

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
  const [postings, setPostings] = useState(initialPostings);
  const [extraDaysLeft, setExtraDaysLeft] = useState<Record<string, number | null>>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  // 연습용으로 저장한 공고(이 탭에만 있음)를 붙이고, 방금 저장한 공고를 알린다
  useEffect(() => {
    const practice = loadPracticePostings();
    const justSaved = takeJustSaved();
    if (practice.length === 0) return;
    const now = new Date();
    /* eslint-disable react-hooks/set-state-in-effect -- 브라우저 저장소는 화면을 그린 뒤에만 읽을 수 있다 */
    setPostings((prev) => [...prev, ...practice.filter((p) => !prev.some((q) => q.id === p.id))]);
    setExtraDaysLeft(
      Object.fromEntries(
        practice.map((p) => [p.id, p.deadlineKind === "date" && p.deadlineAt ? daysUntil(p.deadlineAt, now) : null]),
      ),
    );
    /* eslint-enable react-hooks/set-state-in-effect */
    if (justSaved) {
      setHighlightId(justSaved);
      toast("저장했어요 · 연습용이라 이 탭을 닫으면 사라져요");
      const timer = setTimeout(() => setHighlightId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  function setStepCompleted(postingId: string, stepIndex: number, completedAt: string | null) {
    setPostings((prev) =>
      prev.map((p) =>
        p.id !== postingId
          ? p
          : { ...p, steps: p.steps.map((s, i) => (i === stepIndex ? { ...s, completedAt } : s)) },
      ),
    );
  }

  // 연습용 예시: 이 화면 안에서만 바뀌고 저장되지는 않는다 (5단계에서 DB 연결)
  function handleComplete(posting: Posting, stepIndex: number) {
    setStepCompleted(posting.id, stepIndex, new Date().toISOString());
    toast(`${posting.company} · ${posting.steps[stepIndex].name} 완료`, {
      action: { label: "되돌리기", onClick: () => setStepCompleted(posting.id, stepIndex, null) },
    });
  }

  const allDaysLeft = { ...daysLeft, ...extraDaysLeft };
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
              daysLeft={allDaysLeft[posting.id]}
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
                daysLeft={allDaysLeft[posting.id]}
              highlight={posting.id === highlightId}
                onComplete={handleComplete}
              />
            ))}
        </section>
      )}
    </div>
  );
}
