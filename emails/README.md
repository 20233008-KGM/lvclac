# Auth email templates

Supabase Auth가 보내는 가입 확인·비밀번호 재설정 등 트랜잭션 메일용 HTML 템플릿입니다.

## 사용 방법

1. [`docs/auth-email-setup.md`](../docs/auth-email-setup.md) — Resend 도메인 인증 + Supabase SMTP 연동
2. Supabase 대시보드 → **Authentication** → **Email Templates**
3. 각 템플릿 유형에 `supabase/` 아래 HTML·제목을 붙여넣기

## 파일

| 파일 | Supabase 템플릿 | 용도 |
| --- | --- | --- |
| `supabase/confirm-signup.html` | Confirm signup | 이메일 가입 인증 |
| `supabase/recovery.html` | Reset password | 비밀번호 재설정 (UI 추가 전에도 미리 설정) |
| `supabase/magic-link.html` | Magic Link | 매직 링크 로그인 (미사용 시 그대로 두어도 됨) |
| `supabase/email-change.html` | Change Email Address | 이메일 변경 확인 |

`preview/`는 브라우저에서 레이아웃만 확인하는 샘플입니다. Supabase에는 넣지 않습니다.

## 변수

Supabase Go 템플릿 문법을 그대로 사용합니다.

- `{{ .ConfirmationURL }}` — 인증/재설정 링크
- `{{ .SiteURL }}` — Site URL (운영 도메인으로 설정 필요)
- `{{ .Email }}` — 수신자 이메일

## 브랜드

- 서비스명: 선물 계산기
- 회사: Farfield Software
- 문의: contact@farfield.software
- Accent: `#5b8def` (앱 `--color-primary`와 동일)
