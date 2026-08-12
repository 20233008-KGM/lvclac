import { useEffect, useState } from 'react'
import { PUBLIC_OPERATOR_INFO } from '../config/operator'
import { useLanguage, type Locale } from '../i18n'
import { PublicInfoShell } from './PublicInfoShell'

type CopyStatus = 'idle' | 'copied' | 'error'

const contactCopy = {
  ko: {
    eyebrow: 'LiqGuard · Contact',
    title: '문의하기',
    lead: '영업 관련 제안, 버그 제보, 기타 문의는 아래 이메일로 보내 주세요.',
    channelKicker: '공식 문의 채널',
    intro: '보내주신 내용을 확인한 뒤 순서대로 답변드리겠습니다.',
    emailLabel: '이메일 문의',
    copyEmail: '이메일 주소 복사',
    copied: '복사됨',
    copyError: '복사 실패',
    openEmailApp: '이메일 앱 열기',
    channelNote:
      '주소를 복사해 Gmail 등 원하는 메일 서비스에서 보내거나, 기기의 기본 이메일 앱을 열 수 있습니다.',
    guidanceKicker: '문의 전 확인',
    guidanceTitle: '문의 내용을 함께 알려 주세요',
    guidance: [
      {
        title: '영업 관련 제안',
        body: '제휴, 협업, 서비스 도입 등 제안 내용을 적어 주세요.',
      },
      {
        title: '버그 제보',
        body: '발생한 화면, 재현 순서, 기대한 결과와 실제 결과, 기기와 브라우저 정보를 알려 주시면 확인에 도움이 됩니다.',
      },
      {
        title: '기타 문의',
        body: '서비스 이용, 회사, 개인정보 등 궁금한 내용을 자유롭게 보내 주세요.',
      },
    ],
    subject: '[LiqGuard 문의]',
  },
  en: {
    eyebrow: 'LiqGuard · Contact',
    title: 'Contact us',
    lead: 'Send business proposals, bug reports, and other inquiries to the email below.',
    channelKicker: 'Official contact channel',
    intro: 'We will review your message and respond in order.',
    emailLabel: 'Contact by email',
    copyEmail: 'Copy email address',
    copied: 'Copied',
    copyError: 'Copy failed',
    openEmailApp: 'Open email app',
    channelNote:
      'Copy the address and use Gmail or any email service, or open your device’s default email app.',
    guidanceKicker: 'Before you send',
    guidanceTitle: 'What to include',
    guidance: [
      {
        title: 'Business proposals',
        body: 'Tell us about partnership, collaboration, or service adoption proposals.',
      },
      {
        title: 'Bug reports',
        body: 'Include the affected screen, steps to reproduce, expected and actual results, and your device and browser when possible.',
      },
      {
        title: 'Other inquiries',
        body: 'Send any questions about the service, company, or privacy.',
      },
    ],
    subject: '[LiqGuard inquiry]',
  },
} as const satisfies Record<Locale, object>

async function copyToClipboard(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textArea = document.createElement('textarea')
  textArea.value = value
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.select()
  const copied = document.execCommand('copy')
  textArea.remove()
  if (!copied) throw new Error('Clipboard copy failed')
}

function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m5.5 12.5 4 4 9-9" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

export function ContactPage() {
  const { locale } = useLanguage()
  const copy = contactCopy[locale]
  const email = PUBLIC_OPERATOR_INFO.contactEmail
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const mailtoHref = `mailto:${email}?subject=${encodeURIComponent(copy.subject)}`

  useEffect(() => {
    if (copyStatus === 'idle') return
    const timer = window.setTimeout(() => setCopyStatus('idle'), 2200)
    return () => window.clearTimeout(timer)
  }, [copyStatus])

  const handleCopy = async () => {
    try {
      await copyToClipboard(email)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  return (
    <PublicInfoShell
      activePath={null}
      tone="company"
      eyebrow={copy.eyebrow}
      title={copy.title}
      lead={copy.lead}
      showNavigation={false}
    >
      <div className="contact-main">
        <section className="contact-channel" aria-labelledby="contact-email-title">
          <div className="contact-channel__heading">
            <p className="contact-kicker">{copy.channelKicker}</p>
            <h2 id="contact-email-title">{copy.emailLabel}</h2>
            <p>{copy.intro}</p>
          </div>

          <div className="contact-email-row">
            <p className="contact-email">{email}</p>
            <div className="contact-copy-control">
              <span className="contact-copy-feedback" role="status" aria-live="polite">
                {copyStatus === 'copied' && copy.copied}
                {copyStatus === 'error' && copy.copyError}
              </span>
              <button
                type="button"
                className="contact-copy-button"
                data-copy-status={copyStatus}
                aria-label={copyStatus === 'copied' ? copy.copied : copy.copyEmail}
                title={copyStatus === 'copied' ? copy.copied : copy.copyEmail}
                onClick={handleCopy}
              >
                <CopyIcon copied={copyStatus === 'copied'} />
              </button>
            </div>
          </div>

          <div className="contact-channel__footer">
            <p>{copy.channelNote}</p>
            <a className="contact-mail-link" href={mailtoHref}>
              <MailIcon />
              <span>{copy.openEmailApp}</span>
              <span className="contact-mail-link__arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </div>
        </section>

        <section className="contact-guidance" aria-labelledby="contact-guidance-title">
          <div className="contact-guidance__heading">
            <p className="contact-kicker">{copy.guidanceKicker}</p>
            <h2 id="contact-guidance-title">{copy.guidanceTitle}</h2>
          </div>
          <ol className="contact-guidance__grid">
            {copy.guidance.map((item, index) => (
              <li key={item.title}>
                <span className="contact-guidance__index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </PublicInfoShell>
  )
}
