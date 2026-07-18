import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/UpdatesPage.tsx'), 'utf8')
const appSource = readFileSync(resolve('src/App.tsx'), 'utf8')
const pagesCss = readFileSync(resolve('src/styles/pages.css'), 'utf8')
const sitemap = readFileSync(resolve('public/sitemap.xml'), 'utf8')

describe('public updates page', () => {
  it('uses the shared information shell without joining its five-tab navigation', () => {
    expect(source).toContain('activePath={null}')
    expect(source).toContain('tone="product-doc"')
    expect(appSource).toContain('isUpdatesPath(pathname)')
    expect(appSource).toContain('<UpdatesPage />')
  })

  it('publishes the agreed empty state in Korean and English', () => {
    expect(source).toContain(
      '아직 공개된 업데이트가 없습니다. 새 기능과 개선 사항을 이곳에 기록합니다.',
    )
    expect(source).toContain(
      'No updates have been published yet. New features and improvements will be recorded here.',
    )
  })

  it('keeps the empty state flat and includes the route in the sitemap', () => {
    expect(pagesCss).toMatch(
      /\.updates-empty\s*{[^}]*border-top:\s*1px solid var\(--public-info-rule\);[^}]*border-bottom:\s*1px solid var\(--public-info-rule\);/s,
    )
    expect(sitemap).toContain('<loc>https://liqguard.com/updates</loc>')
  })
})
