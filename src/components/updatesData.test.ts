import { describe, expect, it } from 'vitest'
import { buildUpdateEntries, UPDATE_ENTRIES } from './updatesData'

function markdown(
  id: string,
  locale: 'ko' | 'en',
  publishedAt = '2026-08-12',
): string {
  return `---
id: ${id}
publishedAt: ${publishedAt}
locale: ${locale}
type: ${locale === 'ko' ? '개선' : 'Improvement'}
title: ${locale === 'ko' ? '한국어 제목' : 'English title'}
description: ${locale === 'ko' ? '한국어 설명입니다.' : 'English description.'}
---
${locale === 'ko' ? '첫 문단입니다.\n\n## 자세한 내용\n\n본문입니다.' : 'First paragraph.\n\n## Details\n\nBody copy.'}
`
}

describe('update Markdown content', () => {
  it('loads the published bilingual update from Markdown files', () => {
    expect(UPDATE_ENTRIES).toHaveLength(1)
    expect(UPDATE_ENTRIES[0]).toMatchObject({
      id: '2026-08-12-beta-experience',
      publishedAt: '2026-08-12',
      content: {
        ko: {
          type: '개선',
          title: 'LiqGuard 베타 사용 경험을 개선했습니다',
          description: '첫 사용 안내, 계산기 크기 조절 안정성, 공식 문의 경로를 개선했습니다.',
        },
        en: {
          type: 'Improvement',
          title: 'Improved the LiqGuard beta experience',
          description: 'Improved first-use guidance, calculator resizing stability, and the official contact path.',
        },
      },
    })
    expect(UPDATE_ENTRIES[0].content.ko.body).toContain('## 첫 사용 안내를 더 자연스럽게')
    expect(UPDATE_ENTRIES[0].content.en.body).toContain('## More natural first-use guidance')
  })

  it('builds one localized entry from a matching Markdown pair', () => {
    expect(
      buildUpdateEntries({
        '/content/updates/sample-update.ko.md': markdown('sample-update', 'ko'),
        '/content/updates/sample-update.en.md': markdown('sample-update', 'en'),
      }),
    ).toEqual([
      {
        id: 'sample-update',
        publishedAt: '2026-08-12',
        content: {
          ko: {
            type: '개선',
            title: '한국어 제목',
            description: '한국어 설명입니다.',
            body: '첫 문단입니다.\n\n## 자세한 내용\n\n본문입니다.',
          },
          en: {
            type: 'Improvement',
            title: 'English title',
            description: 'English description.',
            body: 'First paragraph.\n\n## Details\n\nBody copy.',
          },
        },
      },
    ])
  })

  it('rejects an update when one locale is missing', () => {
    expect(() =>
      buildUpdateEntries({
        '/content/updates/sample-update.ko.md': markdown('sample-update', 'ko'),
      }),
    ).toThrow('missing en document')
  })

  it('rejects mismatched publication dates across locales', () => {
    expect(() =>
      buildUpdateEntries({
        '/content/updates/sample-update.ko.md': markdown('sample-update', 'ko'),
        '/content/updates/sample-update.en.md': markdown(
          'sample-update',
          'en',
          '2026-08-13',
        ),
      }),
    ).toThrow('publishedAt must match across locales')
  })

  it('rejects an invalid publication date', () => {
    expect(() =>
      buildUpdateEntries({
        '/content/updates/sample-update.ko.md': markdown(
          'sample-update',
          'ko',
          '2026-02-30',
        ),
        '/content/updates/sample-update.en.md': markdown(
          'sample-update',
          'en',
          '2026-02-30',
        ),
      }),
    ).toThrow('publishedAt must be a valid YYYY-MM-DD date')
  })

  it('rejects duplicate locale documents for one update', () => {
    expect(() =>
      buildUpdateEntries({
        '/content/updates/sample-update.ko.md': markdown('sample-update', 'ko'),
        '/content/updates/nested/sample-update.ko.md': markdown('sample-update', 'ko'),
        '/content/updates/sample-update.en.md': markdown('sample-update', 'en'),
      }),
    ).toThrow('duplicate ko document')
  })
})
