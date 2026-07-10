# 버그 및 예외 케이스 로그

> 로드맵 1부(인증/저장) 통합 테스트 결과. 실제 연결된 Supabase 프로젝트(`yszjblzmzipshwtylqxa`)를 대상으로
> Auth REST API 직접 호출 + `pg_policies`/스키마 조회로 검증했다(브라우저 자동화 도구 미가용으로 실제 클릭
> 플로우 대신 백엔드 계약을 직접 검증). 테스트 계정은 검증 후 전부 삭제(cascade) 완료.
>
> **2026-07-07 후속 세션에서 버그 1·2 모두 수정 및 재검증 완료.** 상세는 각 항목의 "수정 완료" 블록 참고.

## 요약

| 범위 | 결과 |
|---|---|
| 이메일 회원가입/로그인/로그아웃/세션 복원 | ✅ 정상 (버그 2건 발견 → **수정 완료**) |
| Google OAuth 로그인 + 프로필/닉네임 | ⚠️ 코드 재검토만 수행, 실 브라우저 플로우 미검증(도구 제약) |
| number_sets CRUD (Supabase) | ✅ 정상 — insert/update/select/delete, RLS 소유자 격리 모두 확인 |
| 비로그인 로컬 저장 → 로그인 시 클라우드 마이그레이션 | ✅ 로직 정상 (기반 함수 `saveNumberSet` 실동작 확인) |

**신규 발견 버그: 2건 (High 1, Medium 1) — 둘 다 수정 완료.** + **2026-07-10 스키마 드리프트 1건(High) 수정 완료.** + 참고사항 2건(마이그레이션 이력 불일치는 해소, 나머지는 유지).

---

## 버그 1 (High) — ~~`order_history` / `account_snapshots` 테이블이 실제 DB에 없음~~ ✅ 수정 완료

**증상:** 마이페이지(`MyPage.tsx`)의 기록 개수 조회와 결과 패널(`ResultPanel.tsx`)의 주문 이력/스냅샷 저장이
로그인 상태에서 항상 실패한다.

**재현:**
```
GET {SUPABASE_URL}/rest/v1/order_history?user_id=eq.<uid>&select=id&limit=1
→ 404 { "code": "PGRST205", "message": "Could not find the table 'public.order_history' in the schema cache" }

GET {SUPABASE_URL}/rest/v1/account_snapshots?user_id=eq.<uid>&select=id&limit=1
→ 동일하게 404 PGRST205
```
`to_regclass('public.order_history')` / `to_regclass('public.account_snapshots')` 모두 `null`.

**원인:** `supabase/migrations/005_account_records.sql`이 두 테이블을 생성하는데, 원격 프로젝트의 적용된
마이그레이션 이력(`list_migrations`)에는 `launch_schema` / `harden_launch_schema` /
`revoke_auth_trigger_function` 3건만 있고 `account_records`(005), `subscriptions`(006)는 없다.
(단, `subscriptions` 테이블 자체는 실제로 존재하는 것으로 보아 006은 마이그레이션 이력 없이 수동 적용된
것으로 추정 — 005만 완전히 누락된 상태.)

**영향:** `d470602`(계정 기록·마이페이지 기능 커밋) 이후 배포된 코드가, 실제 사용 중인 Supabase 프로젝트
기준으로는 **주문 이력 저장, 스냅샷 저장, 마이페이지 기록 개수 표시 기능이 전부 에러 처리 경로로 빠진다.**
(`MyPage.tsx`는 `t.myPage.storageError`를 띄우고, `ResultPanel.tsx`는 `t.accountRecords.orderSaveError`
알림을 띄움 — 크래시는 아니지만 기능이 조용히 죽어 있음.)

**놓친 이유:** 기존 단위테스트(`accountRecords.test.ts`, 284개 테스트 전부 통과)는 Supabase 클라이언트를
모킹하기 때문에 실제 원격 스키마 드리프트를 잡아내지 못한다. → CI/통합테스트 부재가 이 버그를 검출하지
못한 근본 원인.

**제안 조치:** `supabase/migrations/005_account_records.sql`을 실제 프로젝트에 적용(`supabase db push`
또는 MCP `apply_migration`). 이후 `list_migrations`로 5/6번이 정상적으로 이력에 잡히는지, `006`도 함께
재확인 필요.

**✅ 수정 완료 (2026-07-07):** MCP `apply_migration`으로 `005_account_records.sql`을 원격 프로젝트에
그대로 적용. 적용 후 확인:
- `list_tables` → `public.order_history`, `public.account_snapshots` 정상 생성 확인(컬럼/FK/RLS 모두
  마이그레이션 파일과 일치).
- `list_migrations` → `20260706213423 account_records` 이력에 정상 등재.
- 실제 REST API로 로그인 테스트 계정을 만들어 `MyPage`/`ResultPanel`이 쓰는 것과 동일한 요청 재현:
  기록 개수 조회(0건 확인) → `createOrderHistory`/`createAccountSnapshot` insert(201 성공) → 개수 조회
  (1건으로 반영) → `fetchRecentRecords` 목록 조회 → 소유자 아닌 anon 토큰으로 조회 시 0건(RLS 격리 확인)
  → delete 정상 → 테스트 계정 cascade 삭제로 정리. **버그 재현 안 됨.**

---

## 버그 2 (Medium) — ~~이미 가입된 이메일로 재가입 시 "이메일 확인" 안내가 뜸~~ ✅ 수정 완료

**증상:** 이미 가입(및 이메일 인증 완료)된 계정으로 다시 회원가입을 시도하면, 앱은 `signUpWithPassword`가
`'confirm_email'`을 반환한 것으로 처리해 "인증 메일을 확인해주세요" 안내를 띄운다. 실제로는 새 계정이
생성된 것도, 인증이 필요한 것도 아니고 이미 로그인 가능한 계정이 있다는 뜻이라 사용자에게는 혼동을 줄 수
있다(로그인을 하면 되는데 메일함을 확인하러 감).

**재현 (실제 API 응답, 이미 `email_confirm: true`로 생성해 둔 계정 기준):**
```
POST /auth/v1/signup { email: <기존 가입 이메일>, password: ... }
→ HTTP 200, error 없음
→ body: { id, email, created_at, ..., "identities": [] }   // 세션 없음
```
Supabase는 이메일 열거(enumeration) 공격 방지를 위해 이미 가입된 이메일로 재가입을 시도해도 에러를
반환하지 않고, `identities: []`(빈 배열)인 "가짜" user 객체를 200으로 반환한다.

`AuthContext.tsx`의 `signUpWithPassword`:
```ts
const { data, error } = await supabase.auth.signUp(...)
if (error) return mapAuthError(error.message)          // error가 없으므로 여기로 안 옴
if (data.user && !data.session) return 'confirm_email' // 항상 이 분기로 빠짐
```
`mapAuthError`에 있는 `'already registered'` 문자열 매칭 기반 `email_taken` 판별 로직은 Supabase가 더 이상
에러를 반환하지 않으므로 **현재 도달 불가능한 코드**다. 대신 `data.user.identities.length === 0` 여부로
"이미 가입된 계정"을 판별해야 한다.

**영향 완화 요인:** `RegisterForm.tsx`가 `'confirm_email'`과 `'email_taken'`을 이미 동일하게
`t.auth.confirmEmailSent` 문구로 처리하고 있어(계정 존재 여부를 UI에서 굳이 구분해 보여주지 않음),
치명적인 정보 노출이나 기능 중단은 없다. 다만 `t.auth.emailTaken` i18n 문구(ko/en 둘 다 정의돼 있음)는
사실상 죽은 코드이고, "이미 계정이 있으니 로그인하라"는 더 정확한 안내를 사용자에게 줄 기회를 놓치고 있다.

**제안 조치:** `data.user?.identities?.length === 0`일 때 `'email_taken'`을 반환하도록 `signUpWithPassword`
수정. UI 문구는 "이미 가입된 이메일입니다. 로그인해주세요" 쪽으로 분리 표시할지 여부는 기획 판단 필요
(이메일 열거 방지 관점에서는 지금처럼 뭉뚱그리는 것도 유효한 선택).

**✅ 수정 완료 (2026-07-07):**
- `src/context/AuthContext.tsx`의 `signUpWithPassword`에 `data.user.identities?.length === 0` 검사를
  `confirm_email` 판정보다 먼저 추가해 `'email_taken'`을 정확히 반환하도록 수정.
- `src/components/auth/RegisterForm.tsx`에서 `'confirm_email'`과 `'email_taken'`을 분리 — 전자는 기존과
  동일하게 `t.auth.confirmEmailSent` 안내(success 톤), 후자는 `authErrorMessage`를 통해
  `t.auth.emailTaken`("이미 가입된 이메일입니다.") 안내(error 톤)로 표시.
- **검증:** `email_confirm:true`로 만든 실제 계정에 동일 이메일로 재가입 요청 → API 응답
  `identities: []` 확인 → 앱과 동일한 매핑 로직으로 재현했을 때 `'email_taken'`이 정확히 반환됨을 확인
  (수정 전에는 `'confirm_email'`이 반환됐었음). **버그 재현 안 됨.**
- 참고: 이메일 열거 방지 관점에서 "계정이 존재한다"는 사실 자체를 노출하는 트레이드오프가 있음 — 메모:
  사용자 승인 하에 정확한 안내를 우선하는 쪽으로 결정.

---

## 참고사항 (버그는 아니나 기록)

1. ~~**마이그레이션 이력과 실제 DB 상태 불일치.**~~ ✅ 해소 — `005_account_records`가 이제 `list_migrations`
   이력에 정상 등재됨. `006_subscriptions.sql`은 여전히 이력에 없지만 테이블은 존재(대시보드/수동 SQL로
   적용된 것으로 추정) — 이 부분은 그대로 남아있으니, 다음에 스키마를 만질 일이 있으면 `006`도 이력에
   맞춰 재적용하거나 최소한 상태를 재확인할 것.

2. **Google OAuth 로그인은 이번 세션에서 실제 브라우저로 재검증하지 못함.** 브라우저 자동화 도구가
   연결돼 있지 않아 `signInWithGoogle` → 리다이렉트 → `detectSessionInUrl` 콜백 처리까지의 실제 클릭
   플로우는 검증하지 못했다. 코드 구조(`AuthContext.tsx`, `GoogleButton.tsx`, `supabaseClient.ts`의
   `detectSessionInUrl: true`)는 이전 검증 시점과 동일하게 정상으로 보인다.

3. **테스트 커버리지 공백.** `numberSets.ts`(클라우드 CRUD)와 `CalculatorContext.tsx`의
   `migrateLocalDraftToCloud`(로컬→클라우드 마이그레이션) 로직, 그리고 이번에 고친
   `signUpWithPassword`의 `email_taken` 분기에는 전용 단위테스트가 없다. 이번엔 실제 REST 호출로 대체
   검증했지만, 회귀 방지를 위해 모킹 기반 단위테스트 추가를 권장한다.

4. **작업 중 발견: Supabase MCP가 `.mcp.json`에 `--read-only`로 고정돼 있었음.** 이번 수정을 위해 사용자
   승인 하에 플래그를 제거했다(현재 쓰기 가능 상태로 유지 중). 향후 원격 DB 실수 방지가 필요하면 다시
   `--read-only`를 추가하는 것을 고려할 것.

---

## 버그 3 (High) — ~~`account_snapshots.source` / `account_snapshot_settings` 스키마 미적용~~ ✅ 수정 완료

**증상 (로컬, 2026-07-10):** 스냅샷 저장 실패, 마이페이지/기록 아카이브 "기록을 불러오지 못했습니다",
`account_snapshot_settings` 관련 기능 실패. `order_history` 단독 조회는 200이었으나
`fetchRecentRecords`가 스냅샷 조회 실패 시 주문기록까지 함께 실패 처리됨.

**재현 (REST, anon 키):**
```
GET .../account_snapshots?select=...,source,source_local_date
→ HTTP 400 { "code": "42703", "message": "column account_snapshots.source does not exist" }

GET .../account_snapshot_settings?select=...
→ HTTP 404 PGRST205 (테이블 없음)
```

**원인:** 2026-07-07에 `005_account_records`만 원격에 적용됨. 이후 코드가 추가한
`007_order_history_autosave`, `008_account_snapshot_automation` 마이그레이션은 미적용 상태였음.

**조치:**
- `supabase/migrations/008_*` 중복 접두사 파일을 타임스탬프 이름으로 정리
  (`20260708120000_account_snapshot_automation.sql` 등)
- Management API로 `007`, `20260708120000` 마이그레이션 적용
- `fetchRecentRecords`를 부분 실패 허용으로 변경(한 테이블 장애가 전체 UI를 죽이지 않게)
- `scripts/db/schemaSmoke.ts` 추가 (`npm run db:schema-smoke`, `npm run db:schema-smoke:crud`)

**✅ 수정 완료 (2026-07-10):** 마이그레이션 적용 후 REST probe 전부 HTTP 200.
`npm run db:schema-smoke:crud`로 테스트 계정 생성 → order/snapshot insert → fetch → delete 검증 완료.

---

## 실행한 검증 상세 (재현용)

- **이메일 가입/로그인/로그아웃/세션복원:** Admin API로 확인된 테스트 계정 생성(`email_confirm:true`) →
  `handle_new_user` 트리거로 `profiles` 행 자동 생성 확인 → `signInWithPassword` 로그인 →
  `GET /auth/v1/user`로 세션 유효성 확인 → `refresh_token` 그랜트로 새로고침 후 세션 복원 확인 →
  `POST /auth/v1/logout` 정상 응답(204) 확인.
- **오류 매핑:** 잘못된 비밀번호 로그인 시 `"Invalid login credentials"` 반환 → `mapAuthError`가
  `invalid_credentials`로 정확히 매핑됨을 코드 검토로 확인.
- **number_sets CRUD + RLS:** 로그인 토큰으로 insert/update/select/delete 전부 성공. 토큰 없이(anon만)
  동일 `user_id`로 select 시 0건 반환 — RLS 소유자 격리 정상 작동 확인.
- **정리:** 테스트로 만든 auth 사용자 전부 Admin API로 삭제, `profiles`/`number_sets` cascade 삭제 확인.

## 수정 검증 상세 (2026-07-07 후속 세션)

- `npm test` — 36 files / 284 tests 전부 통과(회귀 없음).
- `npm run build` (`tsc -b && vite build`) — 타입체크·번들 정상 완료.
- `npm run lint` — 기존에 있던 무관한 경고/에러(react-hooks, react-refresh 관련, `AuthContext.tsx`/
  `RegisterForm.tsx` 외 파일)만 남아있고, 이번에 수정한 두 파일의 diff 자체에서 새로 발생한 lint 에러는
  없음(`AuthContext.tsx`의 fast-refresh 경고는 `useAuth`/`AuthProvider`를 한 파일에서 export하는 기존
  구조 때문이며 이번 수정과 무관).
