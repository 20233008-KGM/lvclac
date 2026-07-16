import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

describe('public guide entry points', () => {
  it('renders the header how-to button and routes /guide to GuidePage', () => {
    const app = source('src/App.tsx')
    const button = source('src/components/HowToUseButton.tsx')

    expect(app).toContain("import { HowToUseButton } from './components/HowToUseButton'")
    expect(app).toContain('<HowToUseButton />')
    expect(app).toContain('const guidePath = isGuidePath(pathname)')
    expect(app).toContain('return <GuidePage />')
    expect(button).toContain('href={GUIDE_PATH}')
    expect(button).toContain('navigate(GUIDE_PATH)')
  })
})
