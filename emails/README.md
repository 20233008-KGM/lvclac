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

`supabase/`와 `preview/` 아래 파일은 모두 `build.mjs`가 만드는 **생성물입니다. 직접 수정하지 마세요** — 다음 빌드 때 덮어써집니다. 문구·레이아웃·색은 `build.mjs`에서 고치고 `node emails/build.mjs`로 다시 만듭니다.

`preview/`는 Go 템플릿 변수를 예시 값으로 채운 한국어·영어 프리뷰입니다(템플릿당 2개). 브라우저에서 열어 확인하며, Supabase에는 넣지 않습니다.

## 다크 모드

라이트/다크 두 벌을 한 HTML로 보냅니다. 규칙을 어기면 특정 클라이언트에서 글자가 사라집니다.

- **순수 `#ffffff` / `#000000`을 쓰지 마세요.** Gmail 앱처럼 색을 강제 반전하는 클라이언트는 순수 흑백을 가장 공격적으로 뒤집습니다. 오프셋 색(`#fdfdfe`, `#f5f7fa`)을 씁니다.
- **인라인 `style`이 기본값이고, `<head>`의 `<style>` 블록은 덮어쓰기 전용입니다.** 인라인을 이기려면 `!important`가 필요합니다.
- 다크 팔레트는 `src/styles/variables.css`의 앱 토큰을 그대로 가져옵니다.
- `<style>` 안에서 미디어 쿼리 닫는 중괄호가 `}}`로 붙지 않게 하세요. Supabase의 Go 템플릿 파서가 액션 종료로 오해할 수 있습니다.

클라이언트별 실제 동작:

| 클라이언트 | 다크 모드에서 보이는 것 | 근거 |
| --- | --- | --- |
| Apple Mail (macOS/iOS), Thunderbird | 다크 카드 | `prefers-color-scheme` 지원 |
| Outlook.com 웹, Outlook 모바일 | 다크 카드 | `[data-ogsc]` / `[data-ogsb]` 폴백 |
| **Gmail 웹/앱** | **라이트 카드 (정상)** | `prefers-color-scheme` 미지원 — 우회 불가 |
| Outlook Windows (Word 엔진) | 라이트 카드, 모서리 각짐 | `border-radius` 미지원 |

목표는 "모든 곳에서 다크"가 아니라 **어디서도 안 깨지고, 지원되는 곳에선 앱과 같은 톤**입니다.

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
- 헤더 배경: `#12151c` (앱 `--color-bg`와 동일) — 라이트/다크 양쪽에서 유지
- 다크 카드: `#1e232d` (앱 `--color-surface`와 동일)
