# Supabase 설정 가이드 (로그인: 이메일/비밀번호 + 구글)

코드는 이미 작성돼 있습니다. 아래 대시보드 작업과 `.env` 설정을 마치면 이메일 로그인이 동작하고, Google OAuth는 Client ID/Secret 등록 후 동작합니다.

현재 런칭용 원격 프로젝트:

- Project ref: `yszjblzmzipshwtylqxa`
- Project URL: `https://yszjblzmzipshwtylqxa.supabase.co`
- 적용된 마이그레이션: `002_launch_schema`, `003_harden_launch_schema`, `004_revoke_auth_trigger_function`
- 런칭 테이블: `profiles`, `number_sets`, `subscriptions`

## 1. 프로젝트 생성

1. https://supabase.com 가입 → **New project**
2. 리전은 **Northeast Asia (Seoul, ap-northeast-2)** 권장 (한국 사용자 지연 최소)
3. 생성 후 **Settings → API** 에서 다음 두 값 확인
   - `Project URL`
   - `anon public` key
4. 프로젝트 루트에 `.env` 생성 (`.env.example` 참고):
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...   # anon public 키
   ```
   > `service_role` 키는 절대 프론트/.env(VITE_)에 넣지 마세요. 서버(웹훅)에서만 사용.

## 2. 이메일 로그인 활성화

- **Authentication → Providers → Email**: 기본 활성. 
- **Confirm email**(이메일 인증) 권장 ON. 코드가 미인증 가입 시 "인증 메일 발송" 안내를 띄우도록 이미 처리돼 있습니다.
- **Authentication → URL Configuration**:
  - Site URL: 운영 도메인 (예: `https://your-domain.com`). 로컬 개발만이면 `http://localhost:5173`
  - Redirect URLs에 추가: `http://localhost:5173`, 운영 도메인

## 3. 구글 로그인 활성화

1. **Google Cloud Console** (https://console.cloud.google.com) → 프로젝트 생성/선택
2. **APIs & Services → OAuth consent screen** 구성 (External, 앱 이름/이메일)
3. **Credentials → Create Credentials → OAuth client ID → Web application**
   - **Authorized redirect URIs** 에 추가:
     ```
     https://<project-ref>.supabase.co/auth/v1/callback
     ```
     (`<project-ref>`는 Supabase URL의 서브도메인)
   - 생성된 **Client ID / Client Secret** 복사
4. Supabase → **Authentication → Providers → Google** → 활성화 후 위 Client ID/Secret 붙여넣기 → 저장

## 4. 테이블 + RLS + 트리거

새 프로젝트를 다시 만들 때는 SQL Editor에 임의 조각을 붙여넣기보다 `supabase/migrations/002_launch_schema.sql` → `003_harden_launch_schema.sql` → `004_revoke_auth_trigger_function.sql` 순서로 적용합니다.

핵심 테이블 계약:

| 테이블 | 주요 컬럼 | 앱 사용처 |
| --- | --- | --- |
| `profiles` | `id`, `email`, `nickname` | `AuthContext`, 헤더 닉네임 |
| `number_sets` | `id`, `user_id`, `title`, `inputs`, `updated_at` | 로그인 사용자 입력값 1세트 저장 |
| `subscriptions` | `id`, `user_id`, `provider`, `status`, `current_period_end` | 2주차 결제/Pro 권한 |

RLS 기준:

- `profiles`: 본인 row만 조회/삽입/수정
- `number_sets`: 본인 row만 조회/삽입/수정/삭제
- `subscriptions`: 본인 row만 조회, 쓰기는 서버 결제 코드에서 service role로 처리 예정

프로필 트리거는 가입 직후 `profiles` row를 만들고, 앱에서도 로그인 후 `ensureProfile()`로 누락 row를 보정합니다.

참고용 최소 구조:

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nickname text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.number_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled set',
  inputs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text unique,
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 5. 실행

```
npm run dev
```

헤더의 로그인 버튼 → 구글 또는 이메일/비밀번호로 가입·로그인. 닉네임은 헤더 아바타에 표시됩니다.

저장 토글 동작:

- 비로그인: `localStorage`에 입력값 저장·복원
- 로그인: `localStorage` 또는 Supabase `number_sets` 최신 1세트 저장·복원·삭제 중 선택
- 로컬 draft가 남아 있으면 “이 기기 저장값을 클라우드로 옮기기” 버튼으로 `number_sets`에 저장
