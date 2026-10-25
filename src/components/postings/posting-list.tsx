"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { PostingCard } from "@/components/postings/posting-card";
import { currentStepIndex, type Posting } from "@/lib/postings";

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
  const [showPast, setShowPast] = useState(false);

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

  const { sections, past } = groupPostings(postings, daysLeft);

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
              daysLeft={daysLeft[posting.id]}
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
                daysLeft={daysLeft[posting.id]}
                onComplete={handleComplete}
              />
            ))}
        </section>
      )}
    </div>
  );
}
