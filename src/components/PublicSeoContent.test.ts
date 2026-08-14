import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/PublicSeoContent.tsx'), 'utf8')
const appSource = readFileSync(resolve('src/App.tsx'), 'utf8')
const guideSource = readFileSync(resolve('src/components/GuidePage.tsx'), 'utf8')
const formulasSource = readFileSync(resolve('src/components/FormulasPage.tsx'), 'utf8')
const footerSource = readFileSync(resolve('src/components/SiteFooter.tsx'), 'utf8')
const localeLinkSource = readFileSync(resolve('src/components/LocaleRouteLink.tsx'), 'utf8')
const appCss = readFileSync(resolve('src/App.css'), 'utf8')
const css = readFileSync(resolve('src/styles/publicSeo.css'), 'utf8')

describe('public SEO content', () => {
  it('keeps the calculator scope and limitations visible on the home page', () => {
    expect(source).toContain('선물 청산가 계산기로 확인할 수 있는 것')
    expect(source).toContain('지수·주식·원자재 선물의 단일 종목 포지션')
    expect(source).toContain('거래소·증권사·브로커 규정')
    expect(appSource).toContain('<PublicHomeSeoSummary />')
  })

  it('keeps a crawlable direct locale link in the quiet footer area', () => {
    expect(appSource).not.toContain('<LocaleRouteLink className="header-locale-link" />')
    expect(footerSource).toContain('<LocaleRouteLink className="site-footer__locale-link" />')
    expect(localeLinkSource).toContain('hrefLang={targetLocale}')
    expect(localeLinkSource).toContain('lang={targetLocale}')
    expect(localeLinkSource).toContain('href={href}')
    expect(localeLinkSource).toContain("targetLocale === 'en' ? 'English' : '한국어'")
    expect(localeLinkSource).not.toContain('aria-haspopup="menu"')
    expect(appCss).toContain('.site-footer__locale-link')
    expect(appCss).not.toContain('.header-locale-menu__popover')
  })

  it('links the calculator, guide, and formulas with descriptive text', () => {
    expect(source).toContain('href={localizedPublicPath(GUIDE_PATH, locale)}')
    expect(source).toContain('href={localizedPublicPath(FORMULAS_PATH, locale)}')
    expect(source).toContain('청산가·증거금 계산 공식 보기')
    expect(source).toContain('선물 청산가 계산기 사용법 보기')
    expect(guideSource).toContain('<PublicDocumentNext current="guide" />')
    expect(formulasSource).toContain('<PublicDocumentNext current="formulas" />')
  })

  it('uses a restrained responsive layout', () => {
    expect(css).toContain('.public-seo-summary')
    expect(css).toContain('border-top: 1px solid var(--color-border-subtle)')
    expect(css).toContain('.public-seo-summary h2::before')
    expect(css).toContain('background: transparent')
    expect(css).toContain('@media (max-width: 640px)')
    expect(css).toContain('flex-direction: column')
  })

  it('keeps the risk notice independent between the calculator and footer content', () => {
    const riskIndex = appSource.indexOf('<ContentRiskNotice />')
    const summaryIndex = appSource.indexOf('<PublicHomeSeoSummary />')
    const footerIndex = appSource.indexOf('<SiteFooter />')

    expect(summaryIndex).toBeGreaterThan(-1)
    expect(riskIndex).toBeGreaterThan(summaryIndex)
    expect(riskIndex).toBeGreaterThan(-1)
    expect(footerIndex).toBeGreaterThan(riskIndex)
    expect(footerSource).not.toContain('<ContentRiskNotice />')
  })
})
