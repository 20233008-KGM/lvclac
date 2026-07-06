# 페르소나 작업 메모리

이 문서는 부서 페르소나가 다음 작업자에게 남겨야 하는 장기 메모리를 기록하는 공간이다. 모든 작업을 여기에 적을 필요는 없지만, 대화가 끝난 뒤에도 남아야 할 결정과 리스크는 가능한 범위에서 기록한다.

## 기록 원칙

- 임시 생각이 아니라 재사용할 가치가 있는 결정, 진행 상태, 미룬 리스크, 인계 사항만 적는다.
- 기능별 공식 문서가 있으면 그 문서를 우선 갱신하고, 여기는 위치를 안내하는 색인처럼 쓴다.
- 오래된 메모리는 완료 처리하거나 관련 문서로 옮긴다.

## 기록 형식

```md
## YYYY-MM-DD - 작업명

- 담당 페르소나:
- 상태:
- 결정:
- 검증:
- 남은 리스크:
- 다음 작업:
- 관련 문서/파일:
```

## 현재 메모

- 2026-07-05: 회사 부서 페르소나 시스템을 도입했다. 호출어와 자동 협업 규칙은 `AGENTS.md`, 부서별 안내는 `docs/personas/README.md`를 기준으로 한다.

## 2026-07-05 - 1주차 로그인/저장 MVP

- 담당 페르소나: 총괄관리자, 제품관리자, 개발관리자, QA관리자, 보안관리자, 법무관리자, 문서관리자
- 상태: 코드 구현 및 빌드 검증 완료. 실제 Google OAuth 대시보드 등록과 실제 계정 로그인 E2E는 사용자 외부 권한 필요.
- 결정: 비로그인은 `localStorage`만 사용한다. 로그인 사용자는 `localStorage`와 Supabase `number_sets` 최신 1세트 중 저장 위치를 직접 선택한다. 로그인은 클라우드 저장을 가능하게 할 뿐 강제하지 않는다. 로컬 draft는 명시 버튼으로만 클라우드에 옮긴다.
- 검증: `npm run test -- src/utils/storedCalculatorInputs.test.ts`, 전체 `npm run test`, `npm run build`, Supabase Advisor(성능 이슈 없음, 유출 비밀번호 보호 경고만 남음).
- 남은 리스크: Google OAuth Client ID/Secret 미등록, 실제 이메일 인증/로그인 계정으로 수동 E2E 필요, production 도메인 redirect URL 미등록, 전체 `npm run lint`는 기존 React lint 이슈로 실패.
- 다음 작업: 사용자가 Google OAuth와 production redirect를 등록한 뒤 로그인/저장 수동 smoke test를 실행한다.
- 관련 문서/파일: `docs/product-core-design.md`, `docs/legacy/login-integration.md`, `docs/legacy/premium/input-sets.md`, `docs/legacy/supabase-setup.md`, `docs/legacy/launch-decisions-2026-07-05.md`, `src/context/CalculatorContext.tsx`, `src/db/numberSets.ts`.

## 2026-07-05 - 제품 핵심 설계 문서와 docs 정리

- 담당 페르소나: 총괄관리자, 제품관리자, 보안관리자, 법무관리자, ui관리자, 문서관리자
- 상태: 문서 구조 정리 완료, 빌드/테스트 검증 완료.
- 결정: 최신 제품 방향은 `docs/product-core-design.md`, 런칭 일정은 `docs/launch-schedule.md`, 부서 기준은 `docs/personas/`에 둔다. 그 외 기능별 과거 문서는 `docs/legacy/` 아래로 묶는다.
- 검증: `npm run build`, `npm run test`, dev 서버 응답 확인(`http://localhost:5173`).
- 남은 리스크: 이동된 레거시 문서의 내부 링크는 참고용으로 남을 수 있다. 전체 `npm run lint`는 기존 React lint 부채로 실패한다.
- 다음 작업: 실제 로그인 계정으로 로컬 저장/클라우드 저장/저장 위치 전환 수동 smoke test.
- 관련 문서/파일: `docs/product-core-design.md`, `docs/legacy/`, `docs/launch-schedule.md`.

## 2026-07-05 - 로그인 사용자 주문기록/계좌스냅샷

- 담당 페르소나: 총괄관리자, 제품관리자, ui관리자, 개발관리자, QA관리자, 보안관리자, 법무관리자, 데이터관리자
- 상태: 코드 구현 및 자동 검증 완료. 실제 Supabase 원격 마이그레이션 적용과 로그인 계정 E2E는 외부 프로젝트 설정 필요.
- 결정: 주문기록은 실제 브로커 체결이 아니라 계산기에서 `계좌에 확정`한 주문 시뮬레이션 기록으로만 저장한다. 계좌스냅샷은 로그인 사용자가 버튼으로 명시 저장한다. 두 데이터는 `order_history`, `account_snapshots` 별도 테이블과 owner-only RLS로 관리한다.
- 검증: `npm run test` 24개 파일/225개 테스트 통과, `npm run build` 통과, 변경 대상 파일 eslint 통과. 전체 `npm run lint`는 기존 lint 부채로 실패한다.
- 남은 리스크: 실제 Supabase 프로젝트에 `005_account_records.sql` 적용 필요, RLS Advisor/실계정 저장·조회·삭제 E2E 필요, in-app browser 제어 도구 미노출로 자동 화면 캡처 검증은 미수행.
- 다음 작업: Supabase 마이그레이션 적용 후 로그인 계정으로 주문 시뮬레이션 저장, 계좌스냅샷 저장, 조회, 삭제 smoke test를 실행한다.
- 관련 문서/파일: `docs/superpowers/specs/2026-07-05-account-records-design.md`, `docs/superpowers/plans/2026-07-05-account-records.md`, `supabase/migrations/005_account_records.sql`, `src/db/accountRecords.ts`, `src/components/AccountRecordsPanel.tsx`, `src/components/ResultPanel.tsx`.
