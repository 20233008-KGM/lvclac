# Supabase 설정 가이드 (로그인: 이메일/비밀번호 + 구글)

코드는 이미 작성돼 있습니다. 아래 대시보드 작업과 `.env` 설정만 하면 로그인이 동작합니다.

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

## 4. 테이블 + RLS + 트리거 (SQL Editor에 붙여넣고 실행)

```sql
-- 프로필: auth.users 와 1:1, 닉네임 저장
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- 가입 시 프로필 자동 생성 (이메일 가입은 nickname 메타데이터, 구글은 full_name 사용)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'nickname',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## 5. 실행

```
npm run dev
```

헤더의 로그인 버튼 → 구글 또는 이메일/비밀번호로 가입·로그인. 닉네임은 헤더 아바타에 표시됩니다.

---

## 다음 단계용 SQL (지금 안 해도 됨)

숫자세트 클라우드 동기화 · 버그 제보 · 구독(결제) 테이블. 해당 기능 구현할 때 실행하세요.

```sql
-- 계산기 설정/숫자세트 동기화
create table if not exists public.number_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.number_sets enable row level security;
create policy "number_sets_own" on public.number_sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 버그 제보
create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.bug_reports enable row level security;
-- 로그인 사용자는 작성 가능, 본인 글만 조회 (관리자는 service_role로 전체 조회)
create policy "bug_reports_insert" on public.bug_reports
  for insert with check (auth.uid() = user_id);
create policy "bug_reports_select_own" on public.bug_reports
  for select using (auth.uid() = user_id);

-- 구독/결제 상태 (웹훅이 service_role로 갱신, 프론트는 읽기만)
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'free',   -- free | active | past_due | canceled
  plan text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);
-- 쓰기 정책 없음 → service_role(서버)만 갱신 가능
```
