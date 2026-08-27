import ReactMarkdown from 'react-markdown'
import { localizedPublicPath, UPDATES_PATH } from '../config/routes'
import { useNavigate } from '../hooks/usePathname'
import { useLanguage, type Locale } from '../i18n'
import { PublicInfoShell } from './PublicInfoShell'
import { UPDATE_ENTRIES } from './updatesData'
import './updates.css'

const detailCopy = {
  ko: {
    eyebrow: 'LiqGuard · 업데이트',
    back: '업데이트 목록',
    notFoundTitle: '업데이트를 찾을 수 없습니다',
    notFoundLead: '요청한 업데이트가 없거나 주소가 변경되었습니다.',
  },
  en: {
    eyebrow: 'LiqGuard · Updates',
    back: 'All updates',
    notFoundTitle: 'Update not found',
    notFoundLead: 'This update does not exist or its address has changed.',
  },
} as const

function formatUpdateDate(publishedAt: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: locale === 'ko' ? 'long' : 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${publishedAt}T00:00:00Z`))
}

export function UpdateDetailPage({ updateId }: { updateId: string }) {
  const { locale } = useLanguage()
  const navigate = useNavigate()
  const copy = detailCopy[locale]
  const entry = UPDATE_ENTRIES.find((candidate) => candidate.id === updateId)
  const listPath = localizedPublicPath(UPDATES_PATH, locale)

  const backLink = (
    <a
      className="updates-detail__back"
      href={listPath}
      onClick={(event) => {
        event.preventDefault()
        navigate(listPath)
      }}
    >
      <span aria-hidden="true">←</span>
      {copy.back}
    </a>
  )

  if (!entry) {
    return (
      <PublicInfoShell
        activePath={null}
        tone="product-doc"
        eyebrow={copy.eyebrow}
        title={copy.notFoundTitle}
        lead={copy.notFoundLead}
        showNavigation={false}
      >
        {backLink}
      </PublicInfoShell>
    )
  }

  const content = entry.content[locale]

  return (
    <PublicInfoShell
      activePath={null}
      tone="product-doc"
      eyebrow={copy.eyebrow}
      title={content.title}
      lead={content.description}
      showNavigation={false}
    >
      <div className="updates-detail__toolbar">
        {backLink}
        <p className="updates-detail__meta">
          <time dateTime={entry.publishedAt}>
            {formatUpdateDate(entry.publishedAt, locale)}
          </time>
          <span aria-hidden="true">·</span>
          <span>{content.type}</span>
        </p>
      </div>
      <article className="updates-article">
        <ReactMarkdown>{content.body}</ReactMarkdown>
      </article>
    </PublicInfoShell>
  )
}
