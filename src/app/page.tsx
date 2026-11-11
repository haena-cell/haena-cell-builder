import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { BrandName } from "@/components/brand";
import { DemoButton, StartButton } from "@/components/start-button";
import { BetaBadge } from "@/components/beta-badge";
import { FeedbackButton } from "@/components/feedback-button";
import { LandingPreview } from "@/components/landing-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StepBar } from "@/components/postings/step-bar";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "공고 링크 붙여넣기",
    body: "채용 공고 주소를 붙여넣어요. 링크로 못 읽는 공고는 글이나 캡처로 넣어요.",
  },
  {
    title: "자동으로 정리, 나는 확인만",
    body: "공고 페이지에 적힌 기업명 · 직무 · 마감일 · 근무지를 채워 드려요. 틀린 칸만 고쳐 저장해요.",
  },
  {
    title: "카드와 달력으로 관리",
    body: "마감이 가까운 순서로 카드가 쌓이고, 서류를 내면 [제출 완료]로 다음 단계로 넘겨요.",
  },
];

// 예시 화면에 쓰는 가짜 공고 단계
const exampleSteps = [
  { id: "1", name: "서류 제출", completedAt: null },
  { id: "2", name: "과제", completedAt: null },
  { id: "3", name: "면접", completedAt: null },
  { id: "4", name: "최종 결과", completedAt: null },
];

// 회색 바탕 위 둥근 흰 판 하나 = 섹션 하나 (DESIGN.md 6)
function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[28px] bg-card px-5 py-12 md:rounded-[36px] md:px-12 md:py-20", className)}>
      {children}
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col overflow-x-hidden bg-background">
      {/* 머리 */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <BrandName />
        <div className="flex items-center gap-1"><FeedbackButton /><BetaBadge /></div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-3 md:gap-4 md:px-5">
        {/* 메인 */}
        <Panel className="md:pt-16 md:pb-12">
          <Reveal>
            <h1 className="max-w-4xl text-4xl leading-[1.15] font-bold tracking-tight md:text-6xl">
              채용공고 링크 하나로
              <br />
              <span className="text-muted-foreground">지원 현황까지</span> 한곳에
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              여러 회사에 동시에 지원하는 취준생을 위한 공고 관리 서비스예요.
              링크를 붙여넣으면 마감일과 전형 단계를 정리해 드리고, 마감이
              가까운 공고와 다음에 할 일을 한 화면에 보여 드려요.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <StartButton className="h-12 px-8 text-base font-semibold" />
              <DemoButton className="h-12 px-6 text-base font-semibold" />
              <span className="text-sm text-muted-foreground">
                Google 계정으로 바로 시작해요
              </span>
            </div>
          </Reveal>
          <div className="mt-10">
            <LandingPreview />
          </div>
        </Panel>

        {/* 작동 방식 */}
        <Panel>
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              링크 하나, 세 단계면 돼요
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-8 md:grid-cols-2 md:items-start">
            <ol className="flex flex-col gap-3">
              {steps.map((s, i) => (
                <li key={s.title}>
                  <Reveal>
                    <div className="flex gap-4 rounded-3xl bg-muted p-5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold">{s.title}</h3>
                        <p className="mt-1 text-base leading-relaxed text-muted-foreground">{s.body}</p>
                      </div>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>

            {/* 예시 화면 */}
            <Reveal>
              <p className="mb-3 text-xs font-semibold text-muted-foreground">예시 화면</p>
              <div className="rounded-3xl bg-background p-3 md:p-4">
                <Card className="flex-row gap-0 rounded-[20px] py-0 md:rounded-[20px]">
                  <div className="flex w-16 shrink-0 flex-col items-center justify-center border-r border-border py-4">
                    <span className="text-[11px] text-muted-foreground">11월</span>
                    <span className="text-[22px] leading-7 font-semibold tabular-nums">05</span>
                    <span className="text-xs text-muted-foreground">목</span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">예시상사</p>
                        <p className="text-sm text-muted-foreground">프로덕트 디자이너</p>
                      </div>
                      <Badge variant="destructive">D-2</Badge>
                    </div>
                    <StepBar steps={exampleSteps} current={0} />
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">이력서</Badge>
                      <Badge variant="secondary">포트폴리오</Badge>
                      <Badge variant="due">과제 · D-1</Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">마감 23:59 · 지금: 서류 제출</span>
                      <Button variant="outline" tabIndex={-1}>
                        제출 완료
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </Reveal>
          </div>
        </Panel>
      </main>

      {/* 푸터 */}
      <footer className="mx-auto w-full max-w-6xl px-5 py-8">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-semibold">Hurdle © 2026</span>
          <Link href="/privacy" className="text-muted-foreground underline-offset-4 hover:underline">개인정보처리방침</Link>
        </div>
      </footer>
    </div>
  );
}
