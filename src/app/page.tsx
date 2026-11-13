import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { BrandName } from "@/components/brand";
import { DemoButton, StartButton } from "@/components/start-button";
import { BetaBadge } from "@/components/beta-badge";
import { FeedbackButton } from "@/components/feedback-button";
import { LandingPreview } from "@/components/landing-preview";
import { Mascot, type MascotPose } from "@/components/mascot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StepBar } from "@/components/postings/step-bar";
import { cn } from "@/lib/utils";

// 단계마다 마스코트 허들이가 한마디 (2026-11-13 사용자 요청, D-78)
const steps: { title: string; body: string; pose: MascotPose; say: string }[] = [
  {
    title: "공고 링크 붙여넣기",
    body: "채용 공고 주소를 붙여넣어요. 링크로 못 읽는 공고는 글이나 캡처로 넣어요.",
    pose: "read",
    say: "링크만 주세요. 공고는 제가 꼼꼼히 읽어 볼게요!",
  },
  {
    title: "자동으로 정리, 나는 확인만",
    body: "공고 페이지에 적힌 기업명 · 직무 · 마감일 · 근무지를 채워 드려요. 틀린 칸만 고쳐 저장해요.",
    pose: "understand",
    say: "헷갈리는 칸은 표시해 둘게요. 확인만 해 주세요.",
  },
  {
    title: "카드와 달력으로 관리",
    body: "마감이 가까운 순서로 카드가 쌓이고, 서류를 내면 [제출 완료]로 다음 단계로 넘겨요.",
    pose: "jump",
    say: "[제출 완료]를 누르면 같이 다음 허들로 폴짝!",
  },
];

// 허들이 말풍선. tail: 꼬리가 향하는 쪽(허들이가 있는 쪽)
function Bubble({
  children,
  tail,
  className,
}: {
  children: React.ReactNode;
  tail: "left" | "bottom";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "relative rounded-2xl px-4 py-3 text-[15px] leading-snug font-medium text-foreground",
        "before:absolute before:size-3 before:rotate-45 before:bg-inherit",
        tail === "left" ? "before:top-1/2 before:-left-1.5 before:-translate-y-1/2" : "before:-bottom-1.5 before:left-1/2 before:-translate-x-1/2",
        className,
      )}
    >
      {children}
    </p>
  );
}

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
    <section className={cn("rounded-2xl bg-card px-5 py-12 md:px-12 md:py-20", className)}>
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
          <Reveal className="md:flex md:items-end md:justify-between md:gap-8">
          <div>
            {/* 휴대폰: 제목 위에 작게 인사 */}
            <div className="mb-6 flex items-center gap-3 md:hidden">
              <Mascot pose="sit" size={72} hop />
              <Bubble tail="left" className="bg-muted">
                안녕하세요, 허들이에요! 마감은 제가 같이 챙길게요.
              </Bubble>
            </div>
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
          </div>
            {/* 컴퓨터: 오른쪽에 크게 인사 */}
            <div className="hidden shrink-0 flex-col items-center gap-4 md:flex">
              <Bubble tail="bottom" className="max-w-60 bg-muted text-center">
                안녕하세요, 허들이에요!
                <br />
                지원한 회사가 많아져도 마감은 제가 같이 챙길게요.
              </Bubble>
              <Mascot pose="sit" size={190} hop />
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
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold">{s.title}</h3>
                        <p className="mt-1 text-base leading-relaxed text-muted-foreground">{s.body}</p>
                        <div className="mt-4 flex items-center gap-2.5">
                          <Mascot pose={s.pose} size={60} />
                          <Bubble tail="left" className="bg-card text-sm">
                            {s.say}
                          </Bubble>
                        </div>
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
                <Card className="flex-row gap-0 rounded-xl py-0">
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

        {/* 마무리: 허들이와 시작하기 */}
        <Panel>
          <Reveal className="flex flex-col items-center text-center">
            <Bubble tail="bottom" className="bg-muted">
              오늘의 허들, 같이 넘어 볼까요?
            </Bubble>
            <Mascot pose="cheer" size={150} className="mt-4" />
            <h2 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">지원 현황, 허들이랑 정리해요</h2>
            <p className="mt-3 text-base text-muted-foreground md:text-lg">
              로그인 없이 예시 화면부터 둘러봐도 괜찮아요.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <StartButton className="h-12 px-8 text-base font-semibold" />
              <DemoButton className="h-12 px-6 text-base font-semibold" />
            </div>
          </Reveal>
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
