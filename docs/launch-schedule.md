# LiqGuard 정식 공개 일정

기준일: 2026-07-16 목요일

검색 공개 갱신: 2026-07-31 금요일부터 검색 크롤링·색인을 먼저 허용하고,
정식 공개 공지와 나머지 런칭 게이트는 2026-08-07 일정을 유지한다.

목표: **2026-08-07 금요일 `liqguard.com` 무료 계산기 정식 공개**

공개 사양:

- 로그인·회원가입 없음
- 계산기 본체와 언어/용어 프리셋, 실행 취소·재실행 제공
- 브라우저 `localStorage` 단일 저장 슬롯 제공
- 광고 레이아웃 제공, AdSense 승인 전에는 자리표시 유지
- `/guide`, `/formulas`, `/about`, `/terms`, `/privacy` 공개
- GA4·AdSense는 Consent Mode v2 기본 거부 상태에서 시작하고, 규제 지역은 Google 인증 CMP 결정을 기다림

로그인·클라우드 저장·기록·결제·관리자 등 전체 기능은 `dev` 브랜치와
`https://devpilgrm.liqguard.com` 개발환경에서 계속 운영한다.

## 배포 구조

| 용도 | Git / Vercel | 도메인 | 범위 |
| --- | --- | --- | --- |
| 실배포 | `main` / `lvclac` | `https://liqguard.com` | 로그인 없는 계산기, 단일 로컬 저장, 가이드·수식·소개, 광고 자리, 약관·개인정보 |
| 개발환경 | `dev` / `lvclac-dev` | `https://devpilgrm.liqguard.com` | 로그인·클라우드·기록·결제·크론 포함 전체 기능 |

운영 규칙:

1. 전체 기능 개발은 `dev`에서 시작한다.
2. 계산기 핵심처럼 양쪽에 필요한 변경만 검증 후 해당 커밋을 `main`에 cherry-pick한다.
3. `dev` 전체를 `main`에 병합하지 않는다.
4. 개발 사이트는 브라우저 접근을 허용하되 `DEV` 표시와 `noindex`를 유지한다.
5. 실배포는 2026-07-31에 `ALLOW_INDEXING=true`로 먼저 전환하되, 정식 공개
   공지와 나머지 런칭 게이트는 8월 7일 일정을 유지한다.

## 현재 완료 상태

- [x] 기존 `main` 기준 영구 `dev` 브랜치 생성·푸시
- [x] 별도 Vercel 프로젝트 `lvclac-dev` 생성
- [x] `lvclac-dev` Production Branch를 `dev`로 설정
- [x] 개발 프로젝트에 Supabase·service role·cron·사이트 URL·검색 차단 환경변수 이관
- [x] Supabase Auth Site URL과 Redirect URL에 개발 도메인 반영
- [x] 개발 배포에 `DEV` 배지 추가
- [x] 개발 전체 앱 테스트 620개·빌드·Vercel 서버 함수 컴파일 통과
- [x] `main`을 로그인 없는 public-lite 사양으로 축소
- [x] 기존 활성 로컬 숫자세트를 단일 공개 저장 슬롯으로 1회 마이그레이션
- [x] 실배포 billing/cron API와 Vercel cron 제거
- [x] 실배포 Production의 Supabase·service-role·cron 환경변수 제거
- [x] `liqguard.com` 배포, 제거 경로 리다이렉트, API 404, `noindex` 검증
- [x] 공개 푸터·가이드·수식·회사 소개·약관·개인정보처리방침 복구
- [x] Consent Mode v2 기본 거부, Google CMP 재진입, 동의 후 GA4·AdSense 실행 구현
- [x] 공개 6경로 sitemap·canonical·페이지별 메타데이터와 AdSense `ads.txt` 자동 생성 구현
- [x] 법인 정보가 없는 색인/실광고 production 빌드 차단 구현
- [ ] Porkbun에 `A devpilgrm 76.76.21.21` DNS 레코드 추가 후 SSL 확인
- [ ] 실제 법인·사업자·개인정보 보호책임자 정보 입력
- [ ] AdSense publisher/광고 단위, GA4 Measurement ID 입력 및 Google CMP(TCF v2.3) 게시
- [ ] Vercel·Google 국외 이전 국가와 보유기간 법무 최종 확인
- [ ] 8월 7일 공개 직전 CMP 허용·거부·철회 네트워크와 개인정보처리방침 최종 확인
- [x] 7월 31일 `ALLOW_INDEXING=true`, robots·sitemap 공개 사양 전환
- [ ] 8월 7일 정식 공개 공지·운영 모니터링 실행

## 런칭 게이트

8월 7일 공개 조건은 아래 항목으로 제한한다. Paddle 승인·로그인·클라우드 기능은
공개 조건이 아니다.

| 게이트 | 완료 기준 |
| --- | --- |
| 제품 | 계산기 핵심 입력·결과·주문 시나리오·undo/redo 회귀 테스트 통과 |
| 저장 | 단일 로컬 저장, 새로고침 복원, 기존 저장값 마이그레이션 통과 |
| 광고 | 값이 없거나 동의 전·거부 후 자리표시 유지, 허용 후에만 광고 요청 |
| 콘텐츠 | `/`, `/guide`, `/formulas`, `/about` 내용·탐색·한영 문구 완성 |
| 법적 | `/terms`, `/privacy`, 운영자 표시, 면책·문의·광고/쿠키·국외 이전 설명 최종 확인 |
| 배포 | `main → liqguard.com`, `dev → devpilgrm.liqguard.com` 자동배포·SSL 정상 |
| 분리 | 실배포 번들·네트워크에 Auth/Supabase/Billing/API 실행 코드 없음 |
| 검색 | 7월 31일부터 `noindex` 제거, robots·sitemap 공개 사양 유지 |
| 운영 | 이전 Vercel Production 배포 롤백 경로와 공개 후 모니터링 준비 |

## 날짜별 일정

| 날짜 | 사람 작업 | AI/Codex 작업 | 완료 기준 |
| --- | --- | --- | --- |
| **7/16 목** | Porkbun 로그인 가능 상태 확인 | 브랜치·Vercel 프로젝트 분리, public-lite 구현·배포 | 코드·Vercel 분리 완료 |
| **7/17 금** | Porkbun `devpilgrm` A 레코드 추가 | DNS·SSL·개발 로그인·클라우드·cron smoke test | 개발 도메인 전체 기능 접근 가능 |
| **7/18~7/24** | 모바일·데스크톱 실사용 피드백 | 계산기 핵심 P0/P1 회귀 수정, 양쪽 공통 수정은 선별 cherry-pick | 계산기 차단 버그 0건 |
| **7/25~7/31** | 광고 신청·법적 문구 육안 확인 | 광고 자리 반응형 QA, 개인정보·쿠키 문구 정리, 7/31 검색 색인 조기 허용 | 광고 미승인 상태에서도 레이아웃 고정, 검색 크롤링 가능 |
| **8/1~8/3** | 실제 기기 저장·복원 확인 | public bundle·경로·네트워크·성능 최종 검사 | RC 후보 확정 |
| **8/4 화** | 공개 정보·문의처 최종 확인 | RC 코드 동결, 전체 테스트·빌드 | release candidate 확정 |
| **8/5 수** | 모바일/데스크톱 최종 사용 | Production smoke, 저장 마이그레이션 재검증 | 공개 차단 문제 0건 |
| **8/6 목** | 공개 공지 확인 | 태그·릴리즈 노트·롤백·모니터링 준비 | Go/No-Go 결정 |
| **8/7 금** | 공개 공지 게시 | 검색 공개 상태 재확인, 재배포·모니터링 | **LiqGuard 무료 계산기 정식 공개** |

## 광고 정책

- AdSense 승인은 공개 조건이 아니다.
- 승인 전에는 현재 자리표시를 유지한다.
- 실제 광고 값은 `main` Production에만 설정한다. `dev`에는 실제 광고를 넣지 않는다.
- 실제 광고 활성화 전 개인정보처리방침을 광고·쿠키 기준으로 최종 검토한다.
- AdSense Privacy & messaging에서 Google 인증 CMP를 TCF v2.3 기준으로 게시하고
  Consent Mode 연동을 켠다.
- 규제 지역과 국가 판별 전에는 GA4 측정·광고 요청을 시작하지 않는다.
- 구체 입력값과 대시보드 클릭 작업은
  [`docs/public-launch-checklist.md`](./public-launch-checklist.md)를 따른다.

## 개발환경 후속 범위

아래 항목은 공개 계산기와 분리해 `dev`에서 계속 개발한다.

- 로그인·회원가입·비밀번호 복구
- Supabase 클라우드 숫자세트
- 주문 기록·계좌 스냅샷·자동 크론
- Paddle 결제·Pro 권한·환불/해지
- 피드백·관리자·UI 키트

법인·사업자·정산계좌·Paddle 준비는 유료 기능 출시 트랙으로 계속 관리하되,
8월 7일 무료 계산기 공개를 막지 않는다.

## 장애 대응

- 실배포 장애 시 Vercel의 직전 Production 배포로 즉시 롤백한다.
- `lvclac-dev`는 별도 프로젝트이므로 실배포 롤백의 영향을 받지 않아야 한다.
- 인증·클라우드 코드가 `main`에 되돌아오면 해당 병합을 중단하고 public-lite 기준
  커밋만 복구한다.

## 매일 마감 체크

1. 사람 작업의 외부 처리 상태와 남은 클릭 작업을 기록한다.
2. AI 작업은 관련 테스트와 `npm run build`를 통과시킨다.
3. GitHub push와 Notion Tasks/Work Log/Decision Log를 최신화한다.
4. 8월 7일 Google Calendar 공개 게이트 설명을 현재 사양과 맞춘다.

이 일정은 법률·세무 자문이 아니다. 광고·쿠키·사업자 표시 의무는 실제 공개 지역과
운영 형태를 기준으로 전문가 또는 관할기관에 최종 확인한다.
