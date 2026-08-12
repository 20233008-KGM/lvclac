import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  PUBLIC_PAGE_METADATA,
  PUBLIC_PAGE_PATHS,
  publicPageMetadata,
} from '../config/publicPageMetadata'

const source = readFileSync(resolve('src/components/PublicPageMetadata.tsx'), 'utf8')

describe('public page metadata', () => {
  it.each(PUBLIC_PAGE_PATHS)('defines Korean and English metadata for %s', (path) => {
    expect(PUBLIC_PAGE_METADATA.ko[path].title).toBeTruthy()
    expect(PUBLIC_PAGE_METADATA.ko[path].description).toBeTruthy()
    expect(PUBLIC_PAGE_METADATA.en[path].title).toBeTruthy()
    expect(PUBLIC_PAGE_METADATA.en[path].description).toBeTruthy()
  })

  it('normalizes trailing slashes and falls back to the calculator metadata', () => {
    expect(publicPageMetadata('ko', '/guide/')).toEqual(PUBLIC_PAGE_METADATA.ko['/guide'])
    expect(publicPageMetadata('en', '/missing')).toEqual(PUBLIC_PAGE_METADATA.en['/'])
  })

  it('updates canonical and Open Graph metadata on route changes', () => {
    expect(source).toContain(`link[rel="canonical"]`)
    expect(source).toContain(`meta[property="og:title"]`)
    expect(source).toContain(`meta[property="og:description"]`)
    expect(source).toContain(`meta[property="og:url"]`)
  })
})
