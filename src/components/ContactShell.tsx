import { useEffect, type ReactNode } from 'react'
import type { BoardId } from '../config/boards'
import { useLanguage } from '../i18n'
import { AuthButton } from './auth/AuthButton'
import { LegalLinks } from './ServiceDisclaimer'
import '../styles/pages.css'

interface ContactShellProps {
  boardId: BoardId
  children: ReactNode
}

export function ContactShell({ boardId, children }: ContactShellProps) {
  const { t } = useLanguage()
  const board = t.boards.items[boardId]

  useEffect(() => {
    document.documentElement.dataset.zone = 'contact'
    return () => {
      delete document.documentElement.dataset.zone
    }
  }, [])

  return (
    <div className="contact-zone" data-board={boardId}>
      <header className="contact-header">
        <div className="contact-header__top">
          <div className="contact-header__actions">
            <AuthButton variant="header" />
          </div>
        </div>

        <div className="contact-header__brand">
          <p className="contact-header__company">{t.boards.portalCompany}</p>
          <h1 className="contact-header__page-title">{board.title}</h1>
          <p className="contact-header__page-desc">{board.description}</p>
        </div>
      </header>

      {children}

      <footer className="contact-footer">
        <p className="contact-footer__copy">{t.footer.copyright}</p>
        <LegalLinks variant="footer" />
      </footer>
    </div>
  )
}
