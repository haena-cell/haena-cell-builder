import { Reveal } from "@/components/reveal";
import { StartButton } from "@/components/start-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StepBar } from "@/components/postings/step-bar";

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
    title: "AI가 정리, 나는 확인만",
    body: "기업명 · 직무 · 마감일 · 제출 서류 · 전형 절차를 채워 드려요. 틀린 칸만 고쳐 저장해요.",
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
    <div className="mb-8 flex items-center gap-3">
      <span className="text-sm font-extrabold text-primary">{no}</span>
      <Separator className="flex-1 data-horizontal:h-0.5 bg-foreground" />
      <span className="text-sm font-bold">{children}</span>
    </div>
  );
}

function ThickRule() {
  return <Separator className="data-horizontal:h-1 bg-foreground" />;
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      {/* 머리 */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <span className="text-lg font-extrabold tracking-tight">이름 미정</span>
        <Badge variant="outline">연습용 서비스</Badge>
      </header>
      <div className="mx-auto w-full max-w-5xl px-5">
        <ThickRule />
      </div>

      <main className="flex-1">
        {/* 1. 히어로 */}
        <section className="mx-auto max-w-5xl px-5 py-16 md:py-28">
          <Reveal>
            <Badge variant="secondary" className="mb-6">
              연습용으로 만든 서비스예요 · 가짜 공고로 먼저 써 보세요
            </Badge>
            <h1 className="max-w-4xl text-4xl leading-[1.15] font-extrabold tracking-tight md:text-6xl">
              채용공고 링크 하나로
              <br />
              <span className="text-primary">지원 현황</span>까지 한곳에
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              여러 회사에 동시에 지원하는 취준생을 위한 공고 관리 서비스예요.
              링크를 붙여넣으면 마감일과 전형 단계를 정리해 드리고, 마감이
              가까운 공고와 다음에 할 일을 한 화면에 보여 드려요.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <StartButton className="h-12 px-8 text-base font-bold" />
              <span className="text-sm text-muted-foreground">
                Google 계정으로 바로 시작해요
              </span>
            </div>
          </Reveal>
        </section>

        <div className="mx-auto max-w-5xl px-5">
          <ThickRule />
        </div>

        {/* 2. 문제 */}
        <section className="mx-auto max-w-5xl px-5 py-16 md:py-28">
          <Reveal>
            <SectionLabel no="01">문제</SectionLabel>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              공고 모으기가 또 하나의 일이 돼요
            </h2>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
              마음에 드는 공고를 보면 일단 캡처하거나 북마크해 두지만, 마감일을
              챙기려면 결국 노션이나 스프레드시트에 하나씩 옮겨 적어야 해요.
              지원하는 곳이 늘어날수록 어디에 서류를 냈고 다음이 무엇인지
              놓치기 쉬워요.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {pains.map((p, i) => (
              <Reveal key={p.title}>
                <Card className="h-full border-t-4 border-foreground ring-foreground/15">
                  <CardHeader>
                    <span className="text-3xl font-extrabold text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <CardTitle className="mt-2 text-lg font-bold">
                      {p.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-base leading-relaxed text-muted-foreground">
                    {p.body}
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        {/* 3. 작동 방식 */}
        <section className="bg-secondary">
          <div className="mx-auto max-w-5xl px-5 py-16 md:py-28">
            <Reveal>
              <SectionLabel no="02">작동 방식</SectionLabel>
              <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                링크 하나, 세 단계면 돼요
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-10 md:grid-cols-2 md:items-start">
              <ol className="flex flex-col gap-5">
                {steps.map((s, i) => (
                  <li key={s.title}>
                    <Reveal>
                      <Card className="ring-foreground/15">
                        <CardHeader>
                          <Badge className="mb-2">STEP {i + 1}</Badge>
                          <CardTitle className="text-lg font-bold">
                            {s.title}
                          </CardTitle>
                          <CardDescription className="text-base leading-relaxed">
                            {s.body}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Reveal>
                  </li>
                ))}
              </ol>

              {/* 예시 화면 */}
              <Reveal>
                <p className="mb-3 text-xs font-bold text-muted-foreground">
                  예시 화면
                </p>
                <Card className="shadow-[8px_8px_0_0_var(--foreground)] ring-2 ring-foreground">
                  <CardHeader className="border-b">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="font-extrabold">예시상사</CardTitle>
                        <CardDescription>프로덕트 디자이너</CardDescription>
                      </div>
                      <Badge variant="destructive">D-2</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <StepBar steps={exampleSteps} current={0} />
                    <div className="flex flex-wrap gap-2">
                      <Badge>이력서</Badge>
                      <Badge>포트폴리오</Badge>
                      <Badge variant="outline">과제</Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-between gap-3 border-t">
                    <span className="text-sm text-muted-foreground">마감 23:59 · 지금: 서류 제출</span>
                    <Button variant="outline" tabIndex={-1}>
                      제출 완료
                    </Button>
                  </CardFooter>
                </Card>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 4. 이래서 쓰게 돼요 */}
        <section className="mx-auto max-w-5xl px-5 py-16 md:py-28">
          <Reveal>
            <SectionLabel no="03">이래서 쓰게 돼요</SectionLabel>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-2">
            <Reveal>
              <Card className="h-full bg-primary text-primary-foreground ring-0">
                <CardHeader>
                  <span className="text-sm font-bold opacity-90">
                    처음 써 보면 ✨
                  </span>
                  <CardTitle className="mt-2 text-2xl leading-snug font-extrabold tracking-tight">
                    링크를 붙여넣고 확인만 눌렀더니, 마감일과 전형 단계가 카드
                    한 장에 정리돼 있어요.
                  </CardTitle>
                </CardHeader>
              </Card>
            </Reveal>
            <Reveal>
              <Card className="h-full ring-2 ring-foreground">
                <CardHeader>
                  <span className="text-sm font-bold text-primary">
                    계속 쓰게 되는 이유
                  </span>
                  <CardTitle className="mt-2 text-2xl leading-snug font-extrabold tracking-tight">
                    서류를 내고, 과제를 하고, 면접을 볼 때마다 단계를 넘기며
                    다음에 할 일을 확인하게 돼요.
                  </CardTitle>
                </CardHeader>
              </Card>
            </Reveal>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-5">
          <ThickRule />
        </div>

        {/* 5. 다른 점 */}
        <section className="mx-auto max-w-5xl px-5 py-16 md:py-28">
          <Reveal>
            <SectionLabel no="04">다른 점</SectionLabel>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              옮겨 적지 않아도 돼요
            </h2>
          </Reveal>
          <div className="mt-12 grid max-w-3xl gap-0">
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
                label: "이름 미정",
                body: "어디서 본 공고든 링크 · 글 · 캡처로 넣으면 정리되고, 전형 단계까지 한곳에서 봐요.",
                highlight: true,
              },
            ].map((row) => (
              <Reveal key={row.label}>
                <div className="grid gap-2 border-b border-foreground/20 py-6 md:grid-cols-[10rem_1fr] md:gap-8">
                  <span
                    className={
                      row.highlight
                        ? "font-extrabold text-primary"
                        : "font-bold text-muted-foreground"
                    }
                  >
                    {row.label}
                  </span>
                  <p
                    className={
                      row.highlight
                        ? "text-lg leading-relaxed font-bold"
                        : "text-lg leading-relaxed"
                    }
                  >
                    {row.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* 7. 시작하기 */}
        <section className="bg-foreground text-background">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center md:py-28">
            <Reveal>
              <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                이번 공고부터
                <br />
                한곳에 모아 보세요
              </h2>
              <p className="mt-6 text-base leading-relaxed opacity-80 md:text-lg">
                연습용 서비스예요. 처음 들어오면 연습용 예시 공고 3개로 먼저 둘러볼 수 있어요.
              </p>
              <StartButton className="mt-10 h-12 px-8 text-base font-bold" />
            </Reveal>
          </div>
        </section>

        {/* 8. 만든 사람 */}
        <section className="mx-auto max-w-3xl px-5 py-16 md:py-28">
          <Reveal>
            <SectionLabel no="05">만든 사람</SectionLabel>
            <div className="flex items-start gap-5">
              <Avatar className="size-14 rounded-none">
                <AvatarFallback className="rounded-none bg-primary text-base font-extrabold text-primary-foreground">
                  1018
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-extrabold tracking-tight">1018</p>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground md:text-lg">
                  취준생이 공고를 옮겨 적는 시간을 줄이고, 지원을 놓치지 않도록
                  돕고 싶어서 만들고 있어요.
                </p>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* 9. 푸터 */}
      <footer className="mx-auto w-full max-w-5xl px-5 pb-10">
        <ThickRule />
        <div className="flex flex-col gap-2 pt-6 text-sm text-muted-foreground md:flex-row md:justify-between">
          <span className="font-bold text-foreground">이름 미정 © 2026</span>
          <span>Built with Claude Code · AI 프로덕트 빌더 클럽 3기</span>
        </div>
      </footer>
    </div>
  );
}
