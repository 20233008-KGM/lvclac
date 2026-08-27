import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(resolve(path), 'utf8')

describe('shared localized updates routing', () => {
  it('wires list and detail routes into the dev app without public SEO assets', () => {
    const app = source('src/App.tsx')
    const routes = source('src/config/routes.ts')

    expect(app).toContain('isUpdatesPath(pathname)')
    expect(app).toContain('updateIdFromPath(pathname)')
    expect(app).toContain('<UpdatesPage />')
    expect(app).toContain('<UpdateDetailPage updateId={updateId} />')
    expect(routes).toContain("export const ENGLISH_PATH_PREFIX = '/en'")
    expect(routes).toContain('localizedPublicPath')
  })

  it('keeps language switching on localized public URLs', () => {
    const toggle = source('src/components/LanguageToggle.tsx')
    const shell = source('src/components/PublicInfoShell.tsx')
    const footer = source('src/components/SiteFooter.tsx')

    expect(toggle).toContain('isLocalizablePublicPath(pathname)')
    expect(toggle).toContain('navigate(localizedPublicPath(pathname, code))')
    expect(shell).not.toContain('<LocaleRouteLink')
    expect(footer).toContain('<LocaleRouteLink className="site-footer__locale-link" />')
    expect(footer).toContain("localizedPublicPath(link.href, locale)")
  })

  it('renders Markdown detail content with responsive shared styles', () => {
    const detail = source('src/components/UpdateDetailPage.tsx')
    const styles = source('src/components/updates.css')

    expect(detail).toContain('<ReactMarkdown>{content.body}</ReactMarkdown>')
    expect(styles).toContain('.updates-detail__toolbar')
    expect(styles).toMatch(
      /@media \(max-width: 520px\)[\s\S]*\.updates-detail__toolbar[\s\S]*flex-direction: column-reverse/,
    )
  })
})
