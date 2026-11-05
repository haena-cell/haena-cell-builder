import { Reveal } from "@/components/reveal";
import { DemoButton, StartButton } from "@/components/start-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StepBar } from "@/components/postings/step-bar";
import { cn } from "@/lib/utils";

const pains = [
  {
    title: "공고가 여기저기 흩어져 있어요",
    body: "인스타그램 · 채용 사이트 · 커뮤니티에서 본 공고가 캡처와 북마크로 따로 남아요.",
  },
  {
    title: "옮겨 적는 데 시간이 걸려요",
    body: "공고 하나마다 기업명 · 마감일 · 제출 서류를 노션이나 시트에 직접 옮겨 적어요.",
  },
  {
    title: "어디까지 했는지 헷갈려요",
    body: "여러 곳에 동시에 지원하면 서류를 냈는지, 다음이 면접인지 놓치기 쉬워요.",
  },
];

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

function SectionLabel({ no, children }: { no: string; children: string }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      <Badge variant="secondary" className="tabular-nums">{no}</Badge>
      <span className="text-sm font-semibold text-muted-foreground">{children}</span>
    </div>
  );
}

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
        <span className="text-lg font-bold tracking-tight">pacemate</span>
        <Badge variant="warning">연습용 서비스</Badge>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-3 md:gap-4 md:px-5">
        {/* 1. 히어로 */}
        <Panel className="md:py-28">
          <Reveal>
            <Badge variant="secondary" className="mb-6">
              연습용으로 만든 서비스예요 · 가짜 공고로 먼저 써 보세요
            </Badge>
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
        </Panel>

        {/* 2. 문제 */}
        <Panel>
          <Reveal>
            <SectionLabel no="01">문제</SectionLabel>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              공고 모으기가 또 하나의 일이 돼요
            </h2>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
              마음에 드는 공고를 보면 일단 캡처하거나 북마크해 두지만, 마감일을
              챙기려면 결국 노션이나 스프레드시트에 하나씩 옮겨 적어야 해요.
              지원하는 곳이 늘어날수록 어디에 서류를 냈고 다음이 무엇인지
              놓치기 쉬워요.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {pains.map((p, i) => (
              <Reveal key={p.title}>
                <div className="h-full rounded-3xl bg-muted p-6">
                  <span className="text-2xl font-bold text-muted-foreground tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-lg font-bold">{p.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Panel>

        {/* 3. 작동 방식 */}
        <Panel>
          <Reveal>
            <SectionLabel no="02">작동 방식</SectionLabel>
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

        {/* 4. 이래서 쓰게 돼요 */}
        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          <Reveal>
            <div className="h-full rounded-[28px] bg-primary p-8 text-primary-foreground md:rounded-[36px] md:p-12">
              <span className="text-sm font-semibold opacity-70">처음 써 보면</span>
              <p className="mt-3 text-2xl leading-snug font-bold tracking-tight">
                링크를 붙여넣고 확인만 눌렀더니, 마감일과 전형 단계가 카드
                한 장에 정리돼 있어요.
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div className="h-full rounded-[28px] bg-card p-8 md:rounded-[36px] md:p-12">
              <span className="text-sm font-semibold text-muted-foreground">계속 쓰게 되는 이유</span>
              <p className="mt-3 text-2xl leading-snug font-bold tracking-tight">
                서류를 내고, 과제를 하고, 면접을 볼 때마다 단계를 넘기며
                다음에 할 일을 확인하게 돼요.
              </p>
            </div>
          </Reveal>
        </div>

        {/* 5. 다른 점 */}
        <Panel>
          <Reveal>
            <SectionLabel no="03">다른 점</SectionLabel>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              옮겨 적지 않아도 돼요
            </h2>
          </Reveal>
          <div className="mt-10 grid max-w-3xl gap-2">
            {[
              {
                label: "노션 · 스프레드시트",
                body: "원하는 대로 만들 수 있지만, 공고마다 직접 옮겨 적어야 해요.",
              },
              {
                label: "채용 사이트 관심 공고",
                body: "그 사이트 공고만 모이고, 인스타그램 · 커뮤니티에서 본 공고는 따로 챙겨야 해요.",
              },
              {
                label: "pacemate",
                body: "어디서 본 공고든 링크 · 글 · 캡처로 넣으면 정리되고, 전형 단계까지 한곳에서 봐요.",
                highlight: true,
              },
            ].map((row) => (
              <Reveal key={row.label}>
                <div
                  className={cn(
                    "grid gap-2 rounded-3xl px-5 py-5 md:grid-cols-[11rem_1fr] md:gap-8",
                    row.highlight ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  <span className={cn("font-semibold", !row.highlight && "text-muted-foreground")}>{row.label}</span>
                  <p className={cn("text-base leading-relaxed md:text-lg", row.highlight && "font-semibold")}>{row.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Panel>

        {/* 6. 시작하기 */}
        <Panel className="text-center">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              이번 공고부터
              <br />
              한곳에 모아 보세요
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
              연습용 서비스예요. 로그인 전에 예시 공고로 먼저 둘러볼 수 있어요.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <StartButton className="h-12 px-8 text-base font-semibold" />
              <DemoButton className="h-12 px-6 text-base font-semibold" />
            </div>
          </Reveal>
        </Panel>

        {/* 7. 만든 사람 */}
        <Panel>
          <Reveal>
            <SectionLabel no="04">만든 사람</SectionLabel>
            <div className="flex items-start gap-5">
              <Avatar className="size-14">
                <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                  1018
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-bold tracking-tight">1018</p>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground md:text-lg">
                  취준생이 공고를 옮겨 적는 시간을 줄이고, 지원을 놓치지 않도록
                  돕고 싶어서 만들고 있어요.
                </p>
              </div>
            </div>
          </Reveal>
        </Panel>
      </main>

      {/* 푸터 */}
      <footer className="mx-auto w-full max-w-6xl px-5 py-8">
        <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:justify-between">
          <span className="font-semibold text-foreground">pacemate © 2026</span>
          <span>Built with Claude Code · AI 프로덕트 빌더 클럽 3기</span>
        </div>
      </footer>
    </div>
  );
}
