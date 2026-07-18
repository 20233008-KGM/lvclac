import { useLanguage } from '../i18n'
import { PublicInfoShell } from './PublicInfoShell'

const updatesCopy = {
  ko: {
    eyebrow: 'LiqGuard · 업데이트',
    title: '업데이트',
    lead: 'LiqGuard의 주요 변경 사항을 확인할 수 있는 공간입니다.',
    empty:
      '아직 공개된 업데이트가 없습니다. 새 기능과 개선 사항을 이곳에 기록합니다.',
  },
  en: {
    eyebrow: 'LiqGuard · Updates',
    title: 'Updates',
    lead: 'A place to review notable changes to LiqGuard.',
    empty:
      'No updates have been published yet. New features and improvements will be recorded here.',
  },
} as const

export function UpdatesPage() {
  const { locale } = useLanguage()
  const copy = updatesCopy[locale]

  return (
    <PublicInfoShell
      activePath={null}
      tone="product-doc"
      eyebrow={copy.eyebrow}
      title={copy.title}
      lead={copy.lead}
    >
      <p className="updates-empty">{copy.empty}</p>
    </PublicInfoShell>
  )
}
