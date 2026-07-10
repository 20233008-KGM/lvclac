// 한/영 분기 인증 메일 템플릿 생성기.
//
// Supabase Auth는 Go 템플릿으로 본문을 렌더링하므로, 가입 시 저장한
// user_metadata의 language 값으로 문구를 갈라 쓸 수 있다.
// (AuthContext의 signUp options.data.language 참고)
//
//   node emails/build.mjs
//
// 결과물은 emails/supabase/*.html. 대시보드에 붙여넣거나
// scripts/push-email-templates.mjs로 관리 API에 올린다.

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, 'supabase')

/** 언어에 따라 갈라지는 텍스트. language가 없으면 한국어로 떨어진다. */
const t = (ko, en) => `{{ if eq .Data.language "en" }}${en}{{ else }}${ko}{{ end }}`

// 회사(작게) → 제품(크게) → 기능 설명(한 줄) 순으로 헤더에 쌓인다.
// 제품명은 고유명사라 번역하지 않는다. 설명만 언어별로 갈린다.
const BRAND = 'Farfield Software'
const SERVICE = 'LiqGuard'
const TAGLINE = t('선물 청산가·증거금 계산기', 'Futures liquidation & margin calculator')
const CONTACT = 'contact@liqguard.com'

// 색은 src/styles/variables.css의 앱 토큰을 그대로 가져온다.
//
// 순수 #ffffff / #000000은 쓰지 않는다. Gmail 앱처럼 미디어 쿼리를 무시하고
// 색을 강제 반전하는 클라이언트는 순수 흑백을 가장 공격적으로 뒤집기 때문에,
// 살짝 오프셋된 색이 훨씬 얌전하게 처리된다.
const LIGHT = {
  page: '#f6f8fa',
  card: '#fdfdfe',
  border: '#e3e8ef',
  heading: '#1a2233',
  text: '#4a5568',
  muted: '#6b7280',
  faint: '#9aa3b2',
  divider: '#e5eaf0',
}

// 앱과 동일한 다크 팔레트. page는 --color-bg(#12151c)보다 한 단계 어둡게 잡아
// 카드가 배경 위로 떠 보이게 한다(앱의 elevation 규칙과 같은 방향).
const DARK = {
  page: '#0d1017',
  card: '#1e232d',
  border: '#2a3040',
  heading: '#e8eaed',
  text: '#c3c9d4',
  muted: '#9aa3b2',
  faint: '#9aa3b2',
  divider: '#2a3040',
}

// 라이트/다크 양쪽에서 동일하게 유지되는 브랜드 색. 이미 어두운 톤이라
// 다크 카드와 자연스럽게 이어지고, 반전 클라이언트에서만 되돌려주면 된다.
const HEADER_BG = '#12151c'
const ACCENT = '#5b8def'
const ON_DARK = '#f5f7fa'

/**
 * 다크 표현으로 되돌리는 규칙. 미디어 쿼리 안(`prefix` 없음)과
 * Outlook.com의 반전 마커(`[data-ogsc]`) 아래에 각각 한 번씩 찍는다.
 *
 * 인라인 style 속성을 이기려면 !important가 필수다.
 */
const darkRules = (prefix) => {
  // Outlook.com은 인라인 스타일을 가진 요소 자체에 마커를 붙이지만,
  // body 같은 조상에만 붙는 경우도 있어 후손·자기 자신 양쪽을 겨냥한다.
  const s = (cls) => (prefix ? `${prefix} ${cls}, ${cls}${prefix}` : cls)
  return `
    ${s('.e-body')}, ${s('.e-page')} { background-color: ${DARK.page} !important; }
    ${s('.e-card')} { background-color: ${DARK.card} !important; border-color: ${DARK.border} !important; }
    ${s('.e-heading')} { color: ${DARK.heading} !important; }
    ${s('.e-text')} { color: ${DARK.text} !important; }
    ${s('.e-muted')} { color: ${DARK.muted} !important; }
    ${s('.e-faint')} { color: ${DARK.faint} !important; }
    ${s('.e-strong')} { color: ${DARK.heading} !important; }
    ${s('.e-divider')} { border-top-color: ${DARK.divider} !important; }
    ${s('.e-header')} { background-color: ${HEADER_BG} !important; }
    ${s('.e-title')} { color: ${ON_DARK} !important; }
    ${s('.e-accent')} { background-color: ${ACCENT} !important; }
    ${s('.e-btn')} { background-color: ${ACCENT} !important; }
    ${s('.e-btn-label')} { color: ${ON_DARK} !important; }
    ${s('.e-link')} { color: ${ACCENT} !important; }`
}

// 미디어 쿼리 닫는 중괄호가 `}}`로 붙으면 Supabase의 Go 템플릿 파서가
// 액션 종료로 오해할 수 있어, 줄바꿈으로 반드시 떼어 놓는다.
const styleBlock = `
    @media (prefers-color-scheme: dark) {
${darkRules('')}
    }

    /* Outlook.com은 색을 반전하며 data-ogsc(글자)·data-ogsb(배경)를 붙인다.
       미디어 쿼리를 타지 않으므로 같은 규칙을 한 번 더 적용해 되돌린다. */
${darkRules('[data-ogsc]')}
${darkRules('[data-ogsb]')}`

const templates = {
  'confirm-signup': {
    title: t('이메일 인증', 'Confirm your email'),
    subject: t(
      '[LiqGuard] 이메일 인증을 완료해 주세요',
      '[LiqGuard] Confirm your email address',
    ),
    heading: t('이메일 인증을 완료해 주세요', 'Confirm your email address'),
    body: t(
      '안녕하세요. 아래 버튼을 눌러 가입을 마무리해 주세요. 청산가·증거금 계산과 클라우드 저장을 바로 이용할 수 있습니다.',
      'Welcome. Use the button below to finish signing up, and start calculating liquidation prices and margin with cloud-saved presets.',
    ),
    emailLabel: t('가입 이메일', 'Signing up as'),
    cta: t('이메일 인증하기', 'Confirm email address'),
    disclaimer: t(
      '본인이 가입하지 않았다면 이 메일을 무시해 주세요. 링크는 일정 시간 후 만료됩니다.',
      "If you didn't sign up, you can safely ignore this email. The link expires after a while.",
    ),
  },
  recovery: {
    title: t('비밀번호 재설정', 'Reset your password'),
    subject: t('[LiqGuard] 비밀번호 재설정', '[LiqGuard] Reset your password'),
    heading: t('비밀번호 재설정', 'Reset your password'),
    body: t(
      '비밀번호 재설정을 요청하셨습니다. 아래 버튼을 눌러 새 비밀번호를 설정해 주세요.',
      'We received a request to reset your password. Use the button below to choose a new one.',
    ),
    emailLabel: t('계정 이메일', 'Account email'),
    cta: t('비밀번호 재설정하기', 'Reset password'),
    disclaimer: t(
      '본인이 요청하지 않았다면 이 메일을 무시해 주세요. 비밀번호는 변경되지 않습니다.',
      "If you didn't request this, ignore this email. Your password stays unchanged.",
    ),
  },
  'magic-link': {
    title: t('로그인 링크', 'Your sign-in link'),
    subject: t('[LiqGuard] 로그인 링크', '[LiqGuard] Your sign-in link'),
    heading: t('로그인 링크', 'Your sign-in link'),
    body: t(
      '아래 버튼을 눌러 비밀번호 없이 로그인할 수 있습니다.',
      'Use the button below to sign in without a password.',
    ),
    emailLabel: t('요청 이메일', 'Requested for'),
    cta: t('로그인하기', 'Sign in'),
    disclaimer: t(
      '본인이 요청하지 않았다면 이 메일을 무시해 주세요. 링크는 일정 시간 후 만료됩니다.',
      "If you didn't request this, you can safely ignore this email. The link expires after a while.",
    ),
  },
  'email-change': {
    title: t('이메일 주소 변경 확인', 'Confirm your new email'),
    subject: t(
      '[LiqGuard] 이메일 주소 변경 확인',
      '[LiqGuard] Confirm your new email address',
    ),
    heading: t('이메일 주소 변경 확인', 'Confirm your new email address'),
    body: t(
      '계정 이메일 변경을 완료하려면 아래 버튼을 눌러 새 주소를 확인해 주세요.',
      'To finish changing your account email, confirm the new address with the button below.',
    ),
    emailLabel: t('새 이메일', 'New email'),
    cta: t('이메일 변경 확인', 'Confirm new email'),
    disclaimer: t(
      '본인이 요청하지 않았다면 즉시 문의해 주세요. 계정 보안을 확인하겠습니다.',
      "If you didn't request this, contact us immediately so we can secure your account.",
    ),
  },
}

const fallbackNotice = t(
  '버튼이 보이지 않으면 아래 링크를 브라우저에 붙여넣어 주세요.',
  "If the button doesn't work, paste the link below into your browser.",
)
const contactLabel = t('문의', 'Contact')

function render(c) {
  return `<!DOCTYPE html>
<html lang="{{ if eq .Data.language "en" }}en{{ else }}ko{{ end }}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${c.title}</title>
  <style>${styleBlock}
  </style>
</head>
<body class="e-body" style="margin:0;padding:0;background-color:${LIGHT.page};font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="e-page" style="background-color:${LIGHT.page};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="e-card" style="max-width:560px;background-color:${LIGHT.card};border-radius:12px;overflow:hidden;border:1px solid ${LIGHT.border};">
          <tr>
            <td class="e-header" style="background-color:${HEADER_BG};padding:28px 32px 24px;">
              <p class="e-faint" style="margin:0 0 8px;font-size:13px;line-height:1.4;color:${LIGHT.faint};letter-spacing:0.02em;">${BRAND}</p>
              <h1 class="e-title" style="margin:0;font-size:22px;line-height:1.35;font-weight:600;color:${ON_DARK};">${SERVICE}</h1>
              <p class="e-faint" style="margin:6px 0 0;font-size:13px;line-height:1.5;color:${LIGHT.faint};">${TAGLINE}</p>
              <div class="e-accent" style="margin-top:16px;width:48px;height:3px;background-color:${ACCENT};border-radius:999px;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 class="e-heading" style="margin:0 0 12px;font-size:20px;line-height:1.4;font-weight:600;color:${LIGHT.heading};">${c.heading}</h2>
              <p class="e-text" style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${LIGHT.text};">
                ${c.body}
              </p>
              <p class="e-muted" style="margin:0 0 24px;font-size:14px;line-height:1.6;color:${LIGHT.muted};">
                ${c.emailLabel}: <span class="e-strong" style="color:${LIGHT.heading};font-weight:600;">{{ .Email }}</span>
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="e-btn" style="border-radius:8px;background-color:${ACCENT};">
                    <a href="{{ .ConfirmationURL }}" target="_blank" class="e-btn-label" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;line-height:1;color:${ON_DARK};text-decoration:none;border-radius:8px;">
                      ${c.cta}
                    </a>
                  </td>
                </tr>
              </table>
              <p class="e-muted" style="margin:24px 0 0;font-size:13px;line-height:1.7;color:${LIGHT.muted};">
                ${fallbackNotice}
              </p>
              <p style="margin:8px 0 0;font-size:12px;line-height:1.6;word-break:break-all;">
                <a href="{{ .ConfirmationURL }}" class="e-link" style="color:${ACCENT};text-decoration:underline;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="e-divider" style="border-top:1px solid ${LIGHT.divider};">
                <tr>
                  <td style="padding-top:20px;">
                    <p class="e-faint" style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${LIGHT.faint};">
                      ${c.disclaimer}
                    </p>
                    <p class="e-faint" style="margin:0;font-size:12px;line-height:1.6;color:${LIGHT.faint};">
                      ${contactLabel}: <a href="mailto:${CONTACT}" class="e-link" style="color:${ACCENT};text-decoration:none;">${CONTACT}</a>
                      · <a href="{{ .SiteURL }}" class="e-link" style="color:${ACCENT};text-decoration:none;">{{ .SiteURL }}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <p class="e-faint" style="margin:16px 0 0;font-size:11px;line-height:1.5;color:${LIGHT.faint};">© ${BRAND}</p>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

mkdirSync(outDir, { recursive: true })
const rendered = Object.fromEntries(
  Object.entries(templates).map(([name, copy]) => [name, render(copy)]),
)
for (const [name, html] of Object.entries(rendered)) {
  writeFileSync(join(outDir, `${name}.html`), html, 'utf8')
}

const subjects = Object.fromEntries(
  Object.entries(templates).map(([name, copy]) => [name, copy.subject]),
)
writeFileSync(join(outDir, 'subjects.json'), JSON.stringify(subjects, null, 2) + '\n', 'utf8')

// --- 브라우저 확인용 프리뷰 ---------------------------------------------
// Supabase가 치환할 Go 템플릿을 더미 값으로 미리 풀어, 렌더링을 눈으로 확인한다.
// 다크 모드는 브라우저의 prefers-color-scheme을 토글해서 본다.

const LANG_BRANCH = /\{\{ if eq \.Data\.language "en" \}\}([\s\S]*?)\{\{ else \}\}([\s\S]*?)\{\{ end \}\}/g

const SAMPLE = {
  '{{ .ConfirmationURL }}':
    'https://yszjblzmzipshwtylqxa.supabase.co/auth/v1/verify?token=EXAMPLE_TOKEN&type=signup&redirect_to=https://lvclac.vercel.app',
  '{{ .Email }}': 'someone@example.com',
  '{{ .SiteURL }}': 'https://lvclac.vercel.app',
}

/** 언어 분기를 고르고 Supabase 변수를 예시 값으로 채운다. */
function toPreview(html, lang) {
  let out = html.replace(LANG_BRANCH, (_, en, ko) => (lang === 'en' ? en : ko))
  for (const [token, value] of Object.entries(SAMPLE)) {
    out = out.split(token).join(value)
  }
  return out
}

const previewDir = join(here, 'preview')
mkdirSync(previewDir, { recursive: true })
let previewCount = 0
for (const [name, html] of Object.entries(rendered)) {
  for (const lang of ['ko', 'en']) {
    writeFileSync(join(previewDir, `${name}.${lang}.html`), toPreview(html, lang), 'utf8')
    previewCount += 1
  }
}

console.log(
  `생성 완료: ${Object.keys(templates).length}개 템플릿 + subjects.json + 프리뷰 ${previewCount}개`,
)
