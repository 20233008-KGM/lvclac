import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

describe('public content entry points', () => {
  it('renders the header how-to button and routes all public content pages', () => {
    const app = source('src/App.tsx')
    const button = source('src/components/HowToUseButton.tsx')

    expect(app).toContain("import { HowToUseButton } from './components/HowToUseButton'")
    expect(app).toContain('<HowToUseButton')
    expect(app).toContain('fieldGuideActive={fieldHintOn}')
    expect(app).toContain('if (isGuidePath(pathname))')
    expect(app).toContain('<GuidePage />')
    expect(app).toContain('if (isFormulasPath(pathname))')
    expect(app).toContain('<FormulasPage />')
    expect(app).toContain('if (isAboutPath(pathname))')
    expect(app).toContain('<AboutPage />')
    expect(app).toContain('if (isCompanyPath(pathname))')
    expect(app).toContain('<CompanyPage />')
    expect(app).toContain('if (isContactPath(pathname))')
    expect(app).toContain('<ContactPage />')
    expect(button).toContain('href={localizedPublicPath(GUIDE_PATH, locale)}')
    expect(button).toContain('navigate(localizedPublicPath(GUIDE_PATH, locale))')
  })

  it('links the result header to the formula reference', () => {
    const resultPanel = source('src/components/ResultPanel.tsx')

    expect(resultPanel).toContain('href={localizedPublicPath(FORMULAS_PATH, locale)}')
    expect(resultPanel).toContain('navigate(localizedPublicPath(FORMULAS_PATH, locale))')
    expect(resultPanel).toContain('{t.formulas.title}')
    expect(resultPanel).toContain('result-panel__head-actions')
  })
})
