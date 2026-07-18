import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/PublicPageMetadata.tsx'), 'utf8')

describe('public page metadata', () => {
  it.each(['/', '/guide', '/formulas', '/updates', '/about', '/terms', '/privacy'])(
    'defines title, description, and canonical handling for %s',
    (path) => {
      expect(source).toContain(`'${path}': {`)
    },
  )

  it('updates canonical and Open Graph metadata on route changes', () => {
    expect(source).toContain(`link[rel="canonical"]`)
    expect(source).toContain(`meta[property="og:title"]`)
    expect(source).toContain(`meta[property="og:description"]`)
    expect(source).toContain(`meta[property="og:url"]`)
  })
})
