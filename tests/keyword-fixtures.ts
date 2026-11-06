// 키워드 읽기 시험용 가짜 공고 (D-37). 회사·공고는 모두 가상이다. expect 가 정답.
export type Expected = {
  company?: string | null;
  jobTitle?: string | null; // 이 글자를 포함하면 맞음
  employmentType?: string | null;
  location?: string | null; // 이 글자를 포함하면 맞음
  steps?: string[];
  requiredDocs?: string[];
  deadlineKind?: "date" | "rolling" | "until_filled" | null;
  deadlineDate?: string | null;
  deadlineTime?: string | null;
};

export const FIXTURES: { name: string; text: string; expect: Expected }[] = [
  {
    name: "항목 : 값 줄",
    text: `[노을커머스] 퍼포먼스 마케터 신입 채용
근무지 : 서울 성동구 성수동
고용형태 : 정규직 (수습 3개월)
접수기간 : 2026-11-10 ~ 2026-11-30 18:00
제출서류 : 이력서, 포트폴리오
전형절차 : 서류전형 → 1차면접 → 최종합격`,
    expect: { company: "노을커머스", jobTitle: "퍼포먼스 마케터", employmentType: "정규직", location: "서울 성동구", steps: ["서류전형", "1차면접", "최종합격"], requiredDocs: ["이력서", "포트폴리오"], deadlineKind: "date", deadlineDate: "2026-11-30", deadlineTime: "18:00" },
  },
  {
    name: "기호 제목 + 다음 줄 값",
    text: `(주)달콤랩스 채용공고
■ 모집 직무
서비스 기획자
■ 근무 지역
서울 강남구 테헤란로
■ 고용 형태
계약직
■ 지원 마감
2026년 12월 5일
■ 제출 서류
이력서
자기소개서
■ 전형 절차
서류 심사
실무 면접
최종 합격`,
    expect: { company: "달콤랩스", jobTitle: "서비스 기획자", employmentType: "계약직", location: "서울 강남구", steps: ["서류 심사", "실무 면접", "최종 합격"], requiredDocs: ["이력서", "자기소개서"], deadlineKind: "date", deadlineDate: "2026-12-05", deadlineTime: null },
  },
  {
    name: "세로 막대 표",
    text: `회사명 | 리프트래블
직무 | 브랜드 마케터
근무처 | 서울 마포구 합정동
근로 형태 | 정규직
마감일 | 2026.11.21
구비 서류 | 이력서 / 포트폴리오
채용 프로세스 | 서류 > 과제 > 면접 > 처우 협의`,
    expect: { company: "리프트래블", jobTitle: "브랜드 마케터", employmentType: "정규직", location: "서울 마포구", steps: ["서류", "과제", "면접", "처우 협의"], requiredDocs: ["이력서", "포트폴리오"], deadlineKind: "date", deadlineDate: "2026-11-21", deadlineTime: null },
  },
  {
    name: "인스타그램 글",
    text: `🌿 마루핀테크에서 함께할 PM 인턴을 찾아요!
📍 서울 영등포구 여의도
💼 프로덕트 매니저 인턴 (3개월)
⏰ ~11/28까지
📝 제출: 이력서, 포트폴리오
✅ 서류 ➡️ 면접 ➡️ 최종
#채용 #인턴`,
    expect: { company: "마루핀테크", jobTitle: "프로덕트 매니저", employmentType: "인턴", location: "서울 영등포구", steps: ["서류", "면접", "최종"], requiredDocs: ["이력서", "포트폴리오"], deadlineKind: "date", deadlineDate: "2026-11-28", deadlineTime: null },
  },
  {
    name: "문장으로 풀어 쓴 공고",
    text: `㈜봄날푸드에서 마케팅 기획 담당자를 모집합니다.
근무지는 경기 성남시 분당구이며, 고용 형태는 계약직입니다.
지원 마감은 12월 3일까지이고, 이력서와 자기소개서를 제출해 주세요.
전형은 서류 심사, 면접, 최종 합격 순서로 진행됩니다.`,
    expect: { company: "봄날푸드", jobTitle: "마케팅 기획 담당자", employmentType: "계약직", location: "경기 성남시 분당구", steps: ["서류 심사", "면접", "최종 합격"], requiredDocs: ["이력서", "자기소개서"], deadlineKind: "date", deadlineDate: "2026-12-03", deadlineTime: null },
  },
  {
    name: "대괄호 항목",
    text: `[회사명] 스텝핏
[모집부문] 콘텐츠 마케터
[근무지역] 서울 서초구 양재동
[고용형태] 인턴 (정규직 전환 가능)
[접수기간] 11월 10일(화) ~ 11월 25일(수) 17시
[제출서류] 이력서, 자기소개서, 포트폴리오
[전형절차] 1. 서류전형 2. 과제전형 3. 면접전형 4. 최종합격`,
    expect: { company: "스텝핏", jobTitle: "콘텐츠 마케터", employmentType: "인턴", location: "서울 서초구", steps: ["서류전형", "과제전형", "면접전형", "최종합격"], requiredDocs: ["이력서", "자기소개서", "포트폴리오"], deadlineKind: "date", deadlineDate: "2026-11-25", deadlineTime: "17:00" },
  },
  {
    name: "전형 절차 번호 목록",
    text: `하늘모빌리티 사업 기획 신입 채용
고용형태: 정규직
근무지: 경기 성남시 판교
접수 마감: 2026.12.12 23:59
전형 절차
1. 서류 전형
2. 인적성 검사
3. 1차 면접
4. 2차 면접
제출 서류
- 이력서
- 자기소개서`,
    expect: { company: "하늘모빌리티", jobTitle: "사업 기획", employmentType: "정규직", location: "경기 성남시", steps: ["서류 전형", "인적성 검사", "1차 면접", "2차 면접"], requiredDocs: ["이력서", "자기소개서"], deadlineKind: "date", deadlineDate: "2026-12-12", deadlineTime: null },
  },
  {
    name: "채용 시 마감",
    text: `[브릿지룸] 그로스 마케터 채용
근무 위치: 서울 중구
계약 형태: 정규직
마감: 채용 시 마감
제출 자료: 이력서
채용 과정: 서류 - 인터뷰 - 최종 합격`,
    expect: { company: "브릿지룸", jobTitle: "그로스 마케터", employmentType: "정규직", location: "서울 중구", steps: ["서류", "인터뷰", "최종 합격"], requiredDocs: ["이력서"], deadlineKind: "until_filled", deadlineDate: null, deadlineTime: null },
  },
  {
    name: "상시 채용",
    text: `기업명: 온새미로
포지션: 마케팅 매니저
근무 장소: 부산 해운대구
근무 형태: 프리랜서
접수 기간: 상시 채용
필요 서류: 포트폴리오`,
    expect: { company: "온새미로", jobTitle: "마케팅 매니저", employmentType: "프리랜서", location: "부산 해운대구", requiredDocs: ["포트폴리오"], deadlineKind: "rolling", deadlineDate: null, deadlineTime: null },
  },
  {
    name: "채용 사이트 화면 복사 (항목과 값이 다른 줄)",
    text: `로그인 회원가입 채용정보 기업정보
가온소프트
서비스 기획 담당자 채용
지원하기 스크랩
경력
신입·경력
학력
대졸 이상
근무형태
정규직
근무지역
서울 금천구
급여
면접 후 결정
접수기간
시작일 2026.11.02 09:00
마감일 2026.12.01 23:59
관련 공고 더보기`,
    expect: { jobTitle: "서비스 기획", employmentType: "정규직", location: "서울 금천구", deadlineKind: "date", deadlineDate: "2026-12-01", deadlineTime: null },
  },
  {
    name: "영어 항목",
    text: `Company: Lumen Labs
Position: Growth Marketer
Location: Seoul, Gangnam
Employment Type: Full-time
Deadline: 2026-11-29
Hiring Process: Resume > Interview > Offer`,
    expect: { company: "Lumen Labs", jobTitle: "Growth Marketer", employmentType: "정규직", location: "Seoul", steps: ["Resume", "Interview", "Offer"], deadlineKind: "date", deadlineDate: "2026-11-29", deadlineTime: null },
  },
  {
    name: "다른 낱말 섞임 (속으면 안 됨)",
    text: `[새벽공방] 브랜드 디자이너 채용
정규직 전환 기회가 있는 인턴 포지션입니다.
근무지는 프로젝트에 따라 변동될 수 있습니다.
고용형태: 인턴
근무지: 서울 종로구
모집 기간: 2026.11.15 ~ 2026.11.27
우대사항: 이력서에 수상 경력 기재`,
    expect: { company: "새벽공방", jobTitle: "브랜드 디자이너", employmentType: "인턴", location: "서울 종로구", deadlineKind: "date", deadlineDate: "2026-11-27", requiredDocs: [] },
  },
];
