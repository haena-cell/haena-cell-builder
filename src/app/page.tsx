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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const pains = [
  {
    title: "결정의 이유가 사라져요",
    body: "작업이 끝나면 왜 그렇게 정했는지 기억이 나지 않아요.",
  },
  {
    title: "기록이 흩어져 있어요",
    body: "노션 · 사진첩 · 피그마에 조각조각 남아 있어요.",
  },
  {
    title: "어떻게 써야 할지 막막해요",
    body: "케이스 스터디를 어떤 구조로 풀어야 할지 모르겠어요.",
  },
];

const steps = [
  {
    title: "작업하며 한 줄 남기기",
    body: "고민, 바꾼 이유, 시도한 것을 메모나 스크린샷으로 남겨요.",
  },
  {
    title: "AI 가 흐름으로 정리",
    body: "기록을 문제 → 탐색 → 결정 → 결과 흐름으로 묶어요.",
  },
  {
    title: "초안을 내 말투로",
    body: "케이스 스터디 초안을 받아 내 말투로 다듬어요.",
  },
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
        <span className="text-lg font-extrabold tracking-tight">과정노트</span>
        <Badge variant="outline">연습용 가상 서비스</Badge>
      </header>
      <div className="mx-auto w-full max-w-5xl px-5">
        <ThickRule />
      </div>

      <main className="flex-1">
        {/* 1. 히어로 */}
        <section className="mx-auto max-w-5xl px-5 py-16 md:py-28">
          <Reveal>
            <Badge variant="secondary" className="mb-6">
              연습용으로 만든 가상의 서비스예요
            </Badge>
            <h1 className="max-w-4xl text-4xl leading-[1.15] font-extrabold tracking-tight md:text-6xl">
              작업하며 남긴 메모가
              <br />
              <span className="text-primary">케이스 스터디</span>가 돼요
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              포트폴리오를 준비하는 디자인 학습자를 위한 AI 기록장이에요. 작업
              중에 한 줄씩만 남기면, 끝났을 때 과정이 담긴 케이스 스터디 초안을
              만들어 드려요.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <StartButton className="h-12 px-8 text-base font-bold" />
              <span className="text-sm text-muted-foreground">
                과정노트 · 디자인 학습자를 위한 AI 기록장
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
              남은 건 완성 화면뿐이에요
            </h2>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
              프로젝트를 끝내고 포트폴리오를 정리하려고 하면, 왜 그 결정을
              했는지 기억이 잘 나지 않아요. 남은 건 완성 화면과 흩어진
              스크린샷뿐이라 결과만 보여주는 포트폴리오가 돼요. 케이스 스터디를
              처음부터 쓰려니 빈 문서 앞에서 몇 시간씩 막혀요.
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
                한 줄씩, 세 단계면 돼요
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
                    <CardTitle className="font-extrabold">
                      졸업작품 · 온보딩 개선
                    </CardTitle>
                    <CardDescription>오늘 남긴 기록 3개</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="memo">한 줄 기록</Label>
                      <Input
                        id="memo"
                        readOnly
                        tabIndex={-1}
                        value="가입 단계를 3개에서 1개로 줄여 봄"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="why">바꾼 이유</Label>
                      <Textarea
                        id="why"
                        readOnly
                        tabIndex={-1}
                        value="첫 화면에서 너무 많은 걸 물어봐서 시작하기 전에 지친다는 생각이 들었다."
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">문제</Badge>
                      <Badge variant="outline">탐색</Badge>
                      <Badge>결정</Badge>
                      <Badge variant="outline">결과</Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t">
                    <Button className="w-full" tabIndex={-1}>
                      케이스 스터디 초안 만들기
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
                    흩어진 메모 몇 줄을 넣었더니, 내가 잊고 있던 결정 과정까지
                    담긴 초안이 나와요.
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
                    프로젝트를 할 때마다 기록이 쌓이고, 쌓인 기록이 다음
                    포트폴리오의 재료가 돼요.
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
              내 기록에서 시작해요
            </h2>
          </Reveal>
          <div className="mt-12 grid max-w-3xl gap-0">
            {[
              {
                label: "노션 · 메모 앱",
                body: "기록은 남지만, 정리는 직접 해야 해요.",
              },
              {
                label: "GPT",
                body: "한 번에 써 달라고 하면 과정이 없어서 누구에게나 해당하는 일반적인 글이 나와요.",
              },
              {
                label: "과정노트",
                body: "작업하는 동안 남긴 내 기록에서 시작해서, 나만의 과정이 담긴 글이 나와요.",
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
                다음 포트폴리오는
                <br />
                과정부터 남겨 보세요
              </h2>
              <p className="mt-6 text-base leading-relaxed opacity-80 md:text-lg">
                아직 준비 중이에요. 열리면 가장 먼저 써 봐 주세요.
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
                  프로덕트 디자인을 공부하며 포트폴리오를 직접 정리해 보고
                  있어서, 이 막막함을 매일 겪고 있어요.
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
          <span className="font-bold text-foreground">과정노트 © 2026</span>
          <span>Built with Claude Code · AI 프로덕트 빌더 클럽 3기</span>
        </div>
      </footer>
    </div>
  );
}
