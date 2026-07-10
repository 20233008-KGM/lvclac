# Auth 이메일 설정 (Resend + Supabase)

상태: 운영 체크리스트
목표: Supabase 기본 메일 대신 **Farfield Software / 선물 계산기** 브랜드로 인증 메일을 보낸다.

앱 코드는 변경하지 않습니다. `signUpWithPassword` → Supabase Auth가 메일을 보내는 흐름은 그대로 두고, **발송 채널(SMTP)** 과 **템플릿(HTML)** 만 바꿉니다.

관련 파일:

- HTML 템플릿: [`emails/supabase/`](../emails/supabase/)
- 제목 문구: [`emails/supabase/subjects.md`](../emails/supabase/subjects.md)
- 미리보기: [`emails/preview/confirm-signup-preview.html`](../emails/preview/confirm-signup-preview.html) (브라우저에서 열기)

예상 소요: **2~4시간** (도메인 DNS 전파 포함)

---

## 왜 바꾸나

| 항목 | Supabase 기본 | Resend + 커스텀 템플릿 |
| --- | --- | --- |
| 발신 주소 | `mail.app.supabase.io` | `noreply@farfield.software` |
| 디자인 | 기본 HTML | 앱과 맞는 SaaS 스타일 |
| 도달률 | 개발/테스트용 수준 | SPF/DKIM/DMARC로 프로덕션 적합 |
| 한도 | 매우 낮음 | SMTP 연동 후 Rate Limit 조정 가능 |

---

## 1. Resend에서 도메인 인증

1. [Resend](https://resend.com) 가입
2. **Domains** → `farfield.software` 추가 (또는 서비스 전용 서브도메인 `notify.farfield.software`)
3. 표시되는 DNS 레코드(SPF, DKIM, 선택 DMARC)를 도메인 DNS에 추가
4. Resend 대시보드에서 **Verified** 될 때까지 대기 (수 분~48시간)

권장 발신 주소:

| 용도 | 주소 |
| --- | --- |
| Auth 트랜잭션 | `noreply@farfield.software` |
| 고객 문의(기존) | `contact@farfield.software` |

Auth 메일과 마케팅 메일은 서브도메인을 나누면 도달률 관리에 유리합니다. 초기에는 루트 도메인 하나로 시작해도 됩니다.

---

## 2. Supabase에 Resend SMTP 연결

### 방법 A — 원클릭 연동 (추천)

1. [Resend Integrations → Supabase](https://resend.com/settings/integrations)
2. 프로젝트 `yszjblzmzipshwtylqxa` 선택
3. 인증된 도메인 + API 키 생성 → SMTP 자동 설정

### 방법 B — 수동 SMTP

Supabase → **Authentication** → **Email** → **SMTP Settings**

| 필드 | 값 |
| --- | --- |
| Enable custom SMTP | ON |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Resend API 키 (`re_...`) |
| Sender email | `noreply@farfield.software` |
| Sender name | `선물 계산기` |

저장 후 **Authentication → Rate Limits** 에서 이메일 시간당 한도를 늘립니다. 기본 30/h은 런칭 이벤트에 부족할 수 있습니다. (예: 100~200/h)

참고: [Resend × Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp)

---

## 3. Site URL / Redirect URL

인증 링크가 깨지지 않게 **운영 도메인 확정 후** 반드시 맞춥니다.

Supabase → **Authentication** → **URL Configuration**

| 항목 | 로컬 개발 | 프로덕션 |
| --- | --- | --- |
| Site URL | `http://localhost:5173` | `https://<운영-도메인>` |
| Redirect URLs | `http://localhost:5173` | 운영 도메인, Supabase callback |

`AuthContext`의 `emailRedirectTo: window.location.origin` 때문에, 사용자가 가입한 사이트 origin으로 돌아옵니다. **Site URL** 은 메일 안 `{{ .SiteURL }}` 과 기본 리다이렉트에 쓰입니다.

---

## 4. 이메일 템플릿 붙여넣기

Supabase → **Authentication** → **Email Templates**

각 행의 **Subject** 는 [`emails/supabase/subjects.md`](../emails/supabase/subjects.md) 를 복사하고, **Body (HTML)** 에는 아래 파일 **전체**를 붙여넣습니다.

| Supabase 메뉴 | Body 파일 |
| --- | --- |
| Confirm signup | `emails/supabase/confirm-signup.html` |
| Reset password | `emails/supabase/recovery.html` |
| Magic Link | `emails/supabase/magic-link.html` |
| Change Email Address | `emails/supabase/email-change.html` |

`{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .SiteURL }}` 는 Supabase가 자동 치환합니다. 수정하지 마세요.

---

## 5. 검증 체크리스트

- [ ] Resend 도메인 Verified
- [ ] Supabase Custom SMTP 저장됨 (테스트 발송 성공)
- [ ] Confirm signup 템플릿·제목 적용
- [ ] Site URL = 운영 도메인 (프로덕션 배포 시)
- [ ] 테스트 계정으로 가입 → **받은편지함**에 `선물 계산기` 발신으로 도착
- [ ] 인증 링크 클릭 → 로그인/세션 생성 확인
- [ ] 스팸함이 아닌 받은편지함인지 확인 (안 되면 DMARC 추가·발신 도메인 재검토)

### 빠른 테스트

1. 앱에서 새 이메일로 회원가입
2. UI에 "인증 메일을 보냈습니다" 안내 확인 (`RegisterForm`)
3. 메일 수신 → 브랜드 레이아웃·버튼·푸터 문의 링크 확인
4. 인증 후 이메일/비밀번호 로그인

Resend 대시보드 **Logs**에서 delivery/bounce도 확인합니다.

---

## 6. 앱 코드와의 관계

변경 없음. 인증 메일은 여전히 `supabase.auth.signUp()` 이 트리거합니다.

```173:179:src/context/AuthContext.tsx
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { nickname: nickname.trim() },
          emailRedirectTo: window.location.origin,
        },
      })
```

비밀번호 재설정 UI는 아직 없지만, `recovery.html` 을 미리 넣어 두면 나중에 `resetPasswordForEmail` 추가 시 바로 같은 브랜딩이 적용됩니다.

---

## 7. 나중에 (2단계)

repo 템플릿 + 대시보드 수동 붙여넣기가 번거로우면:

- React Email로 템플릿을 코드화
- Supabase Auth Hook으로 발송 (한/영 분기, 닉네임 삽입)

현재 런칭에는 **이 문서의 1~5단계만으로 충분**합니다.

---

## 비밀값

- Resend API 키: Resend / Supabase SMTP에만 저장. **`.env`나 클라이언트에 넣지 않음**
- `RESEND_API_KEY` 는 향후 서버에서 직접 메일을 보낼 때만 `.env`에 추가
