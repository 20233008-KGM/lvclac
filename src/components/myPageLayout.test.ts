import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const pagesCss = readFileSync(resolve('src/styles/pages.css'), 'utf8')
const appCss = readFileSync(resolve('src/App.css'), 'utf8')
const variablesCss = readFileSync(resolve('src/styles/variables.css'), 'utf8')

function blockFor(css: string, selector: string) {
  const match = css.match(new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([^}]+)\\}`))
  return match?.[1] ?? ''
}

describe('my page side/pill nav layout', () => {
  it('defines the --bp-sidebar token', () => {
    expect(variablesCss).toContain('--bp-sidebar: 1024px')
  })

  it('actually references --bp-sidebar-equivalent 1024px in a real media query, not just declaring the token', () => {
    expect(pagesCss).toMatch(/@media \(min-width: 1024px\)\s*\{[\s\S]*\.my-page-body/)
    expect(pagesCss).toMatch(/@media \(max-width: 1023px\)\s*\{[\s\S]*\.my-page-nav/)
  })

  it('lays out .my-page-body as a sidebar + content grid on desktop', () => {
    expect(pagesCss).toContain('grid-template-columns: minmax(9.5rem, max-content) minmax(0, 1fr)')
  })

  it('widens .my-page to make room for the sidebar', () => {
    expect(blockFor(pagesCss, '.my-page')).toContain('width: min(100%, 1080px)')
  })

  it('keeps the sidebar nav sticky on desktop, same pattern as .ad-column', () => {
    expect(pagesCss).toMatch(/\.my-page-nav\s*\{[^}]*position: sticky/)
  })

  it('uses a compact ghost-list nav group instead of tall bordered pills', () => {
    const navBlock = blockFor(pagesCss, '.my-page-nav a')
    expect(navBlock).toContain('min-height: 36px')
    expect(navBlock).not.toContain('line-height: var(--touch-min)')
    expect(blockFor(pagesCss, '.my-page-nav')).toContain('background: var(--color-bg-elevated)')
  })
})

describe('account record tab pill restyle', () => {
  it('removes the 50/50 grid split and center divider that made the tabs look unfinished', () => {
    const tabsBlock = blockFor(appCss, '.account-record-tabs')
    expect(tabsBlock).not.toContain('grid-template-columns')
    expect(appCss).not.toMatch(/\.account-record-tab\s*\{[^}]*border-right/)
  })

  it('gives the active tab an accent-colored pill treatment', () => {
    const activeBlock = blockFor(appCss, '.account-record-tab.active')
    expect(activeBlock).toContain('var(--color-primary)')
  })
})
