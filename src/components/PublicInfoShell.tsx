import { useEffect, type ReactNode } from 'react'
import { PUBLIC_OPERATOR_INFO } from '../config/operator'
import { useNavigate } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import { AuthButton } from './auth/AuthButton'
import {
  publicInfoAriaCurrent,
  publicInfoNavigation,
  type PublicInfoPath,
} from './publicInfoNavigation'
import { SiteFooter } from './SiteFooter'
import '../styles/pages.css'

export type PublicInfoTone = 'product-doc' | 'company' | 'legal'

interface PublicInfoShellProps {
  activePath: PublicInfoPath | null
  tone: PublicInfoTone
  eyebrow: string
  title: string
  lead?: string
  showNavigation?: boolean
  children: ReactNode
}

export function PublicInfoShell({
  activePath,
  tone,
  eyebrow,
  title,
  lead,
  showNavigation = true,
  children,
}: PublicInfoShellProps) {
  const { locale } = useLanguage()
  const navigate = useNavigate()
  const navigation = publicInfoNavigation(locale)
  const backLabel = locale === 'ko' ? '계산기로 돌아가기' : 'Back to calculator'
  const navLabel = locale === 'ko' ? 'LiqGuard 정보 페이지' : 'LiqGuard information pages'
  const spaceLabel = locale === 'ko' ? '문서 공간' : 'Information'

  useEffect(() => {
    document.documentElement.dataset.zone = 'public-info'
    return () => {
      if (document.documentElement.dataset.zone === 'public-info') {
        delete document.documentElement.dataset.zone
      }
    }
  }, [])

  return (
    <div className="public-info-zone" data-info-tone={tone}>
      <div className="public-info-standalone">
        <article
          className="public-info-document"
          data-info-tone={tone}
          data-info-navigation={showNavigation ? 'visible' : 'hidden'}
        >
          <header className="public-info-header">
            <div className="public-info-header__top">
              <a
                className="public-info-brand"
                href="/"
                onClick={(event) => {
                  event.preventDefault()
                  navigate('/')
                }}
              >
                <img
                  className="public-info-brand__mark"
                  src="/favicon.svg"
                  alt=""
                  aria-hidden="true"
                />
                <span className="public-info-brand__name">
                  {PUBLIC_OPERATOR_INFO.productName}
                </span>
                <span className="public-info-brand__space">{spaceLabel}</span>
              </a>

              <div className="public-info-header__actions">
                <a
                  className="public-info-back"
                  href="/"
                  onClick={(event) => {
                    event.preventDefault()
                    navigate('/')
                  }}
                >
                  <span aria-hidden="true">←</span>
                  {backLabel}
                </a>
                <AuthButton variant="header" />
              </div>
            </div>

            <div className="public-info-hero">
              <p className="public-info-eyebrow">{eyebrow}</p>
              <h1 className="public-info-title">{title}</h1>
              {lead && <p className="public-info-lead">{lead}</p>}
            </div>

            {showNavigation && (
              <nav className="public-info-nav" aria-label={navLabel}>
                <ul className="public-info-nav__list">
                  {navigation.map((item) => (
                    <li key={item.path}>
                      <a
                        className="public-info-nav__link"
                        href={item.path}
                        aria-current={publicInfoAriaCurrent(item.path, activePath)}
                        onClick={(event) => {
                          event.preventDefault()
                          navigate(item.path)
                        }}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </header>

          <main className="public-info-content">{children}</main>
        </article>
        <SiteFooter />
      </div>
    </div>
  )
}
