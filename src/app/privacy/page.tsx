import type { Metadata } from "next";
import Link from "next/link";
import { BrandName } from "@/components/brand";

export const metadata: Metadata = {
  title: "개인정보처리방침",
};

// 개인정보처리방침 (D-51). 실제 수집·보관·전송 현황(2026-11-08 확인)에 맞춰 쓴다. 바뀌면 이 화면과 시행일을 함께 고친다
const OPERATOR_NAME = "강허들";
const OPERATOR_EMAIL = "haena.wrk@gmail.com";
const EFFECTIVE_DATE = "2026년 11월 12일";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="flex flex-col gap-3 text-base leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

// 컴퓨터는 표, 휴대폰은 항목별 카드 (좁은 화면에서 옆으로 밀지 않게)
function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <>
      <ul className="flex flex-col gap-2 md:hidden">
        {rows.map((row) => (
          <li key={row[0]} className="rounded-2xl bg-muted p-4 text-sm">
            <p className="font-semibold text-foreground">{row[0]}</p>
            <dl className="mt-2 flex flex-col gap-1.5">
              {row.slice(1).map((cell, i) => (
                <div key={i}>
                  <dt className="text-xs font-semibold">{head[i + 1]}</dt>
                  <dd>{cell}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <TableWide head={head} rows={rows} />
    </>
  );
}

function TableWide({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="hidden overflow-x-auto rounded-2xl border border-border md:block">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead className="bg-muted text-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-t border-border align-top">
              {row.map((cell, i) => (
                <td key={i} className={i === 0 ? "px-4 py-3 font-medium text-foreground" : "px-4 py-3"}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="mx-auto flex w-full max-w-3xl items-center px-5 py-5">
        <Link href="/" aria-label="Hurdle 처음 화면">
          <BrandName />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-3 pb-16 md:px-5">
        <article className="flex flex-col gap-10 rounded-2xl bg-card px-5 py-10 md:px-12 md:py-14">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold tracking-tight">개인정보처리방침</h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              Hurdle(이하 &ldquo;서비스&rdquo;)는 채용 공고와 지원 현황을 정리하는 데 꼭 필요한 정보만 받고, 그 목적에만
              써요. 무엇을 받고 어디에 맡기는지, 언제 지우는지 아래에 적었어요.
            </p>
            <p className="text-sm text-muted-foreground">시행일: {EFFECTIVE_DATE}</p>
          </div>

          <Section title="1. 받는 정보와 쓰는 목적">
            <Table
              head={["받는 정보", "쓰는 목적", "보관 기간"]}
              rows={[
                ["Google 계정의 이메일, 이름, 프로필 사진", "로그인, 내 계정 표시", "계정을 삭제할 때까지"],
                [
                  "내가 저장한 공고(링크, 기업명, 직무, 마감일, 근무지, 제출 서류, 전형 단계, 공고 원문 글)와 준비 항목·할 일",
                  "공고 목록, 달력, 할 일 보여 주기",
                  "공고나 계정을 삭제할 때까지",
                ],
                ["[의견 보내기]의 내용과, 적은 경우 연락처", "문의 답변, 서비스 개선", "받은 날로부터 1년"],
                ["로그인 유지용 쿠키", "다시 로그인하지 않아도 되게", "로그아웃하거나 만료될 때까지"],
              ]}
            />
            <p>
              공고를 정리하려고 올린 <strong className="text-foreground">화면 캡처는 저장하지 않아요.</strong> 정리에만
              쓰고 바로 버려요.
            </p>
            <p>
              목록 정렬 방식 같은 화면 설정은 내 브라우저에만 저장되고 서비스로 보내지 않아요. 접속 기록(IP 주소 등)은
              아래 업체가 보안과 오류 확인을 위해 각자의 기준에 따라 잠시 보관할 수 있어요.
            </p>
          </Section>

          <Section title="2. 맡기는 곳과 해외로 보내는 정보">
            <p>서비스는 아래 업체에 처리를 맡겨요. 이 목적 외에 다른 사람이나 회사에 개인정보를 주거나 팔지 않아요.</p>
            <Table
              head={["업체 (나라)", "맡기는 일", "보내는 정보"]}
              rows={[
                ["Supabase (데이터는 대한민국 서울에 보관)", "로그인, 데이터 저장", "1번의 계정 정보, 공고, 의견"],
                ["Vercel (미국)", "웹사이트와 서버 운영", "서비스를 쓰는 동안 오가는 모든 정보"],
                [
                  "Anthropic (미국)",
                  "공고 글·캡처에서 항목 읽기(AI 정리)",
                  "정리하려고 넣은 공고 글이나 캡처. 보내기 전에 글 속 전화번호·이메일을 지워요",
                ],
                ["Google (미국)", "Google 계정으로 로그인", "Google 이 서비스에 이메일, 이름, 프로필 사진을 알려 줘요"],
              ]}
            />
            <p>
              해외로 보내는 정보는 서비스를 쓰는 순간 인터넷으로 전송되고, 각 업체의 보관 기준에 따라 보관 후 지워져요.
              해외로 보내는 것을 원하지 않으면 서비스 이용을 멈추고 계정을 삭제할 수 있어요. 이 경우 서비스를 쓸 수
              없어요.
            </p>
          </Section>

          <Section title="3. 크롬 확장 프로그램">
            <p>
              확장 프로그램은 아이콘을 누른 그 탭의 주소와 글(이미지 공고면 그 화면 캡처)만 읽어 서비스로 보내요. 다른 탭이나 방문
              기록은 읽지 않아요. 정리 중인 내용은 크롬을 닫을 때까지만 그 브라우저 안에 임시로 두고, 저장하면 지워요.
            </p>
          </Section>

          <Section title="4. 지우는 방법">
            <p>
              <strong className="text-foreground">내 계정 메뉴 → [계정 삭제]</strong>를 누르면 계정과 저장한 공고, 전형
              단계, 준비 항목, 할 일이 바로 모두 지워지고 되돌릴 수 없어요. 보낸 의견은 계정과의 연결만 끊고 1년 동안
              남아요.
            </p>
            <p>공고 하나만 지우려면 공고의 [지우기]를 눌러요.</p>
          </Section>

          <Section title="5. 나의 권리">
            <p>
              언제든 내 정보를 보거나, 고치거나, 지우거나, 처리를 멈춰 달라고 요청할 수 있어요. 대부분은 화면에서 바로 할
              수 있고, 그 밖의 요청은 아래 이메일로 보내 주세요. 늦어도 10일 안에 답할게요.
            </p>
          </Section>

          <Section title="6. 지키는 방법">
            <p>
              모든 정보는 암호화된 연결(https)로 오가요. 데이터베이스는 로그인한 본인만 자기 데이터를 읽고 쓸 수 있게
              막아 두었어요. 운영자는 문의 답변이나 오류 확인에 꼭 필요할 때만 데이터를 확인해요.
            </p>
          </Section>

          <Section title="7. 이용 대상">
            <p>서비스는 만 14세 이상을 대상으로 해요. 만 14세 미만은 가입하지 말아 주세요.</p>
          </Section>

          <Section title="8. 개인정보 보호책임자">
            <p>
              책임자: {OPERATOR_NAME}
              <br />
              이메일:{" "}
              <a href={`mailto:${OPERATOR_EMAIL}`} className="font-medium text-foreground underline underline-offset-4">
                {OPERATOR_EMAIL}
              </a>
            </p>
            <p>
              개인정보 침해에 대한 신고나 상담은 개인정보침해신고센터(국번 없이 118, privacy.kisa.or.kr)나
              개인정보분쟁조정위원회(1833-6972, www.kopico.go.kr)에도 할 수 있어요.
            </p>
          </Section>

          <Section title="9. 바뀔 때">
            <p>이 방침이 바뀌면 시행 7일 전에 이 화면에 알려요. 지난 방침은 요청하면 보내 드려요.</p>
          </Section>
        </article>
      </main>
    </div>
  );
}
