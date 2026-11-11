"use client";

import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 메뉴의 [확장 프로그램] 안내 (D-48)
const EXTENSIONS_URL = "chrome://extensions";

function Panel({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="gap-4 px-4 md:px-6" aria-label={title}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {aside}
      </div>
      {children}
    </Card>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{n}</span>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2 pt-0.5 text-sm leading-relaxed">{children}</div>
    </li>
  );
}

export function ExtensionGuide() {
  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(EXTENSIONS_URL);
      toast("주소를 복사했어요. 크롬 주소창에 붙여넣어 주세요");
    } catch {
      toast.error("복사하지 못했어요. 주소를 직접 입력해 주세요");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel title="이런 일을 해요">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
          <li>채용 공고를 보던 화면에서 아이콘만 누르면 회사명, 직무, 마감일을 정리해 줘요.</li>
          <li>작은 창에서 확인하고 저장하면 내 Hurdle에 바로 들어가요. 다른 화면으로 옮겨 다니지 않아도 돼요.</li>
          <li>이미 저장한 공고면 알려 주고, 저장된 내용을 고칠 수 있어요.</li>
        </ul>
      </Panel>

      <Panel title="설치하기" aside={<span className="text-xs text-muted-foreground">무료 · 약 1분</span>}>
        <p className="rounded-2xl bg-muted px-4 py-3 text-sm leading-relaxed">
          컴퓨터의 크롬에서만 쓸 수 있고, 휴대폰에서는 쓸 수 없어요. 아직 크롬 웹 스토어에 올리기 전이라 파일을 받아 직접 설치해요.
        </p>
        <ol className="flex flex-col gap-4">
          <Step n={1}>
            <p>파일을 받아 더블클릭해 압축을 풀어요. <b>hurdle-extension</b> 폴더가 생겨요. 설치한 뒤에도 이 폴더는 지우지 말고 둬요.</p>
            <Button size="sm" asChild>
              <a href="/hurdle-extension.zip" download>
                <Download data-icon="inline-start" />
                파일 받기
              </a>
            </Button>
          </Step>
          <Step n={2}>
            <p>크롬 주소창에 <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">{EXTENSIONS_URL}</code> 를 붙여넣고 Enter를 눌러요. 보안 때문에 링크로 바로 열 수 없어요.</p>
            <Button variant="outline" size="sm" onClick={copyAddress}>
              <Copy data-icon="inline-start" />
              주소 복사
            </Button>
          </Step>
          <Step n={3}><p>오른쪽 위 <b>개발자 모드</b>를 켜요.</p></Step>
          <Step n={4}><p><b>압축해제된 확장 프로그램을 로드합니다</b>를 누르고 <b>hurdle-extension</b> 폴더를 골라요. 폴더 안으로 들어가지 말고 폴더를 선택해요.</p></Step>
          <Step n={5}><p>크롬 오른쪽 위 퍼즐 아이콘을 누르고, Hurdle 옆 핀을 눌러 아이콘을 고정해요.</p></Step>
        </ol>
      </Panel>

      <Panel title="쓰는 법">
        <ol className="flex flex-col gap-4">
          <Step n={1}><p>같은 크롬에서 Hurdle에 로그인해 둬요.</p></Step>
          <Step n={2}><p>채용 공고 화면에서 검정 P 아이콘을 눌러요.</p></Step>
          <Step n={3}><p>작은 창에서 노란 칸을 확인해요. 근무지, 제출 서류, 전형 절차는 [더보기]에 있어요.</p></Step>
          <Step n={4}><p>[저장]을 누르면 끝이에요.</p></Step>
        </ol>
      </Panel>

      <Panel title="읽는 것과 보내는 곳">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
          <li>아이콘을 <b>누른 탭 하나만</b> 읽어요. 다른 탭이나 방문 기록은 읽지 않아요.</li>
          <li>그 화면의 글을 Hurdle 서버로 보내요. 글이 거의 없는 이미지 공고면 보이는 화면을 한 장 캡처해서 보내요.</li>
          <li>서버는 빈 칸을 채우려고 글이나 캡처를 AI(Anthropic)에 보내요. 글 속 전화번호와 이메일은 지우고 보내지만, 캡처 이미지 안의 글자는 그대로 보내요.</li>
          <li>화면 글과 캡처는 정리에만 쓰고 원문으로 저장하지 않아요. 링크와 확인한 내용만 저장해요.</li>
          <li>비밀번호나 키를 저장하지 않아요. 같은 크롬의 Hurdle 로그인을 그대로 써요.</li>
        </ul>
      </Panel>

      <Panel title="새 버전이 나오면">
        <p className="text-sm leading-relaxed">
          파일을 다시 받아 같은 폴더에 덮어쓴 뒤, <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">{EXTENSIONS_URL}</code> 에서 Hurdle의 새로고침(↻)을 눌러요.
        </p>
      </Panel>
    </div>
  );
}
