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

const BRAND = 'Farfield Software'
const SERVICE = t('선물 계산기', 'Futures Calculator')
const CONTACT = 'contact@farfield.software'

const templates = {
  'confirm-signup': {
    title: t('이메일 인증', 'Confirm your email'),
    subject: t(
      '[선물 계산기] 이메일 인증을 완료해 주세요',
      '[Futures Calculator] Confirm your email address',
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
    subject: t('[선물 계산기] 비밀번호 재설정', '[Futures Calculator] Reset your password'),
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
    subject: t('[선물 계산기] 로그인 링크', '[Futures Calculator] Your sign-in link'),
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
      '[선물 계산기] 이메일 주소 변경 확인',
      '[Futures Calculator] Confirm your new email address',
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
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${c.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#eef1f6;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef1f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #dde3ec;">
          <tr>
            <td style="background-color:#12151c;padding:28px 32px 24px;">
              <p style="margin:0 0 8px;font-size:13px;line-height:1.4;color:#9aa3b2;letter-spacing:0.02em;">${BRAND}</p>
              <h1 style="margin:0;font-size:22px;line-height:1.35;font-weight:600;color:#ffffff;">${SERVICE}</h1>
              <div style="margin-top:16px;width:48px;height:3px;background-color:#5b8def;border-radius:999px;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 12px;font-size:20px;line-height:1.4;font-weight:600;color:#1a2233;">${c.heading}</h2>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4a5568;">
                ${c.body}
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6b7280;">
                ${c.emailLabel}: <span style="color:#1a2233;font-weight:600;">{{ .Email }}</span>
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background-color:#5b8def;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;line-height:1;color:#ffffff;text-decoration:none;border-radius:8px;">
                      ${c.cta}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#6b7280;">
                ${fallbackNotice}
              </p>
              <p style="margin:8px 0 0;font-size:12px;line-height:1.6;word-break:break-all;">
                <a href="{{ .ConfirmationURL }}" style="color:#5b8def;text-decoration:underline;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5eaf0;">
                <tr>
                  <td style="padding-top:20px;">
                    <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#9aa3b2;">
                      ${c.disclaimer}
                    </p>
                    <p style="margin:0;font-size:12px;line-height:1.6;color:#9aa3b2;">
                      ${contactLabel}: <a href="mailto:${CONTACT}" style="color:#5b8def;text-decoration:none;">${CONTACT}</a>
                      · <a href="{{ .SiteURL }}" style="color:#5b8def;text-decoration:none;">{{ .SiteURL }}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;line-height:1.5;color:#9aa3b2;">© ${BRAND}</p>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

mkdirSync(outDir, { recursive: true })
for (const [name, copy] of Object.entries(templates)) {
  writeFileSync(join(outDir, `${name}.html`), render(copy), 'utf8')
}

const subjects = Object.fromEntries(
  Object.entries(templates).map(([name, copy]) => [name, copy.subject]),
)
writeFileSync(join(outDir, 'subjects.json'), JSON.stringify(subjects, null, 2) + '\n', 'utf8')

console.log(`생성 완료: ${Object.keys(templates).length}개 템플릿 + subjects.json`)
