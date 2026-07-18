import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/UpdatesPage.tsx'), 'utf8')
const appSource = readFileSync(resolve('src/App.tsx'), 'utf8')
const pagesCss = readFileSync(resolve('src/styles/pages.css'), 'utf8')
const sitemap = readFileSync(resolve('public/sitemap.xml'), 'utf8')

describe('public updates page', () => {
  it('uses the shared information shell without rendering its five-tab navigation', () => {
    expect(source).toContain('activePath={null}')
    expect(source).toContain('tone="product-doc"')
    expect(source).toContain('showNavigation={false}')
    expect(appSource).toContain('isUpdatesPath(pathname)')
    expect(appSource).toContain('<UpdatesPage />')
  })

  it('renders localized updates in a semantic table and keeps an empty state', () => {
    expect(source).toContain('<table className="updates-table"')
    expect(source).toContain('<time dateTime={entry.publishedAt}>')
    expect(source).toContain('entry.content[locale]')
    expect(source).toContain('<p className="updates-empty">{copy.empty}</p>')
  })

  it('renders accessible URL-backed pagination only when more than ten updates exist', () => {
    expect(source).toContain('sortedUpdates.length > UPDATES_PAGE_SIZE')
    expect(source).toContain('updatesHrefForPage(page, window.location.search)')
    expect(source).toContain('aria-current={page === resolvedPage.page')
    expect(source).toContain('aria-label={copy.firstPage}')
    expect(source).toContain('aria-label={copy.lastPage}')
    expect(source).toContain('updates-pagination__mobile-hidden')
  })

  it('stages a calm page transition and removes its delay for reduced motion', () => {
    expect(source).toContain("type UpdatesTransitionState = 'idle' | 'leaving' | 'entering'")
    expect(source).toContain("window.matchMedia('(prefers-reduced-motion: reduce)').matches")
    expect(source).toContain('data-transition-state={transitionState}')
    expect(source).toContain("aria-busy={transitionState !== 'idle'}")
    expect(pagesCss).toMatch(
      /\.updates-list\[data-transition-state='leaving'\]\s*{[^}]*opacity:\s*0;[^}]*translateY\(-8px\);/s,
    )
    expect(pagesCss).toMatch(
      /\.updates-list\[data-transition-state='entering'\]\s*{[^}]*updates-page-enter 240ms/s,
    )
    expect(pagesCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.updates-list\[data-transition-state\][\s\S]*animation:\s*none;/s,
    )
  })

  it('keeps the update rows flat, pagination responsive, and includes the route in the sitemap', () => {
    expect(pagesCss).toMatch(
      /\.updates-table-wrap\s*{[^}]*border-top:\s*1px solid var\(--public-info-rule\);[^}]*border-bottom:\s*1px solid var\(--public-info-rule\);/s,
    )
    expect(pagesCss).toMatch(/\.updates-table tbody tr\s*{[^}]*display:\s*grid;/s)
    expect(pagesCss).toMatch(
      /\.updates-pagination button\s*{[^}]*width:\s*40px;[^}]*height:\s*40px;/s,
    )
    expect(pagesCss).toMatch(
      /@media \(max-width: 520px\)[\s\S]*\.updates-pagination__mobile-hidden\s*{[^}]*display:\s*none;/s,
    )
    expect(pagesCss).toMatch(
      /\.public-info-document\[data-info-navigation='hidden'\] \.public-info-hero\s*{[^}]*min-height:\s*0;/s,
    )
    expect(pagesCss).toMatch(
      /\.public-info-document\[data-info-navigation='hidden'\] \.public-info-content\s*{[^}]*padding-top:\s*0;/s,
    )
    expect(sitemap).toContain('<loc>https://liqguard.com/updates</loc>')
  })
})
