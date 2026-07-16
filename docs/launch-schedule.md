# LiqGuard 정식 공개 일정

기준일: 2026-07-16 목요일

목표: **2026-08-07 금요일 `liqguard.com` 무료 계산기 정식 공개**

공개 사양:

- 로그인·회원가입 없음
- 계산기 본체와 언어/용어 프리셋, 실행 취소·재실행 제공
- 브라우저 `localStorage` 단일 저장 슬롯 제공
- 광고 레이아웃 제공, AdSense 승인 전에는 자리표시 유지
- `/terms`, `/privacy`만 필수 공개 페이지로 제공

로그인·클라우드 저장·기록·결제·관리자·가이드 등 전체 기능은 `dev` 브랜치와
`https://devpilgrm.liqguard.com` 개발환경에서 계속 운영한다.

## 배포 구조

| 용도 | Git / Vercel | 도메인 | 범위 |
| --- | --- | --- | --- |
| 실배포 | `main` / `lvclac` | `https://liqguard.com` | 로그인 없는 계산기, 단일 로컬 저장, 광고 자리, 약관·개인정보 |
| 개발환경 | `dev` / `lvclac-dev` | `https://devpilgrm.liqguard.com` | 로그인·클라우드·기록·결제·크론 포함 전체 기능 |

운영 규칙:

1. 전체 기능 개발은 `dev`에서 시작한다.
2. 계산기 핵심처럼 양쪽에 필요한 변경만 검증 후 해당 커밋을 `main`에 cherry-pick한다.
3. `dev` 전체를 `main`에 병합하지 않는다.
4. 개발 사이트는 브라우저 접근을 허용하되 `DEV` 표시와 `noindex`를 유지한다.
5. 공개 전까지 실배포도 `ALLOW_INDEXING=false`를 유지하고, 8월 7일에만 해제한다.

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
- [x] Porkbun에 `A devpilgrm 76.76.21.21` DNS 레코드 추가, 공개 DNS·SSL 확인
- [ ] `devpilgrm.liqguard.com` 로그인·클라우드·cron smoke test
- [ ] 8월 7일 공개 직전 AdSense/CMP 상태와 개인정보처리방침 최종 확인
- [ ] 8월 7일 `ALLOW_INDEXING=true`, robots 허용, 공지·모니터링 실행

## 런칭 게이트

8월 7일 공개 조건은 아래 항목으로 제한한다. Paddle 승인·로그인·클라우드 기능은
공개 조건이 아니다.

| 게이트 | 완료 기준 |
| --- | --- |
| 제품 | 계산기 핵심 입력·결과·주문 시나리오·undo/redo 회귀 테스트 통과 |
| 저장 | 단일 로컬 저장, 새로고침 복원, 기존 저장값 마이그레이션 통과 |
| 광고 | 값이 없을 때 자리표시 유지, 모바일·데스크톱 레이아웃 이상 없음 |
| 법적 | `/terms`, `/privacy`, 면책·문의·광고/쿠키 설명 최종 확인 |
| 배포 | `main → liqguard.com`, `dev → devpilgrm.liqguard.com` 자동배포·SSL 정상 |
| 분리 | 실배포 번들·네트워크에 Auth/Supabase/Billing/API 실행 코드 없음 |
| 검색 | 공개 직전까지 `noindex`, 공개 시 robots·sitemap을 공개 사양으로 전환 |
| 운영 | 이전 Vercel Production 배포 롤백 경로와 공개 후 모니터링 준비 |

## 날짜별 일정

| 날짜 | 사람 작업 | AI/Codex 작업 | 완료 기준 |
| --- | --- | --- | --- |
| **7/16 목** | Porkbun 로그인·`devpilgrm` A 레코드 추가 | 브랜치·Vercel 프로젝트 분리, public-lite 구현·배포, 공개 DNS 확인 | 코드·Vercel 분리와 DNS 완료 |
| **7/17 금** | 개발 도메인 실제 로그인 확인 | 개발 로그인·클라우드·cron smoke test | 개발 도메인 전체 기능 접근 가능 |
| **7/18~7/24** | 모바일·데스크톱 실사용 피드백 | 계산기 핵심 P0/P1 회귀 수정, 양쪽 공통 수정은 선별 cherry-pick | 계산기 차단 버그 0건 |
| **7/25~7/31** | 광고 신청·법적 문구 육안 확인 | 광고 자리 반응형 QA, 개인정보·쿠키 문구 정리 | 광고 미승인 상태에서도 레이아웃 고정 |
| **8/1~8/3** | 실제 기기 저장·복원 확인 | public bundle·경로·네트워크·성능 최종 검사 | RC 후보 확정 |
| **8/4 화** | 공개 정보·문의처 최종 확인 | RC 코드 동결, 전체 테스트·빌드 | release candidate 확정 |
| **8/5 수** | 모바일/데스크톱 최종 사용 | Production smoke, 저장 마이그레이션 재검증 | 공개 차단 문제 0건 |
| **8/6 목** | 공개 공지 확인 | 태그·릴리즈 노트·롤백·모니터링 준비 | Go/No-Go 결정 |
| **8/7 금** | 공개 공지 게시 | `ALLOW_INDEXING=true`, robots 허용, 재배포·모니터링 | **LiqGuard 무료 계산기 정식 공개** |

## 광고 정책

- AdSense 승인은 공개 조건이 아니다.
- 승인 전에는 현재 자리표시를 유지한다.
- 실제 광고 값은 `main` Production에만 설정한다. `dev`에는 실제 광고를 넣지 않는다.
- 실제 광고 활성화 전 개인정보처리방침을 광고·쿠키 기준으로 최종 검토하고,
  필요한 지역에는 Google 인증 CMP를 설정한다.

## 개발환경 후속 범위

아래 항목은 공개 계산기와 분리해 `dev`에서 계속 개발한다.

- 로그인·회원가입·비밀번호 복구
- Supabase 클라우드 숫자세트
- 주문 기록·계좌 스냅샷·자동 크론
- Paddle 결제·Pro 권한·환불/해지
- 피드백·관리자·가이드·공식·소개·UI 키트

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
