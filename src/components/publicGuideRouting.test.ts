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
    expect(app).toContain('<HowToUseButton />')
    expect(app).toContain('const guidePath = isGuidePath(pathname)')
    expect(app).toContain('<GuidePage />')
    expect(app).toContain('const formulasPath = isFormulasPath(pathname)')
    expect(app).toContain('<FormulasPage />')
    expect(app).toContain('const aboutPath = isAboutPath(pathname)')
    expect(app).toContain('<AboutPage />')
    expect(app).toContain('const companyPath = isCompanyPath(pathname)')
    expect(app).toContain('<CompanyPage />')
    expect(button).toContain('href={GUIDE_PATH}')
    expect(button).toContain('navigate(GUIDE_PATH)')
  })

  it('links the result header to the formula reference', () => {
    const resultPanel = source('src/components/ResultPanel.tsx')

    expect(resultPanel).toContain('href={FORMULAS_PATH}')
    expect(resultPanel).toContain('navigate(FORMULAS_PATH)')
    expect(resultPanel).toContain('{t.formulas.title}')
    expect(resultPanel).toContain('result-panel__head-actions')
  })
})
