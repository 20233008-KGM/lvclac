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
author: ${locale === 'ko' ? 'LiqGuard 팀' : 'LiqGuard Team'}
release: 2026.08.12
type: ${locale === 'ko' ? '개선' : 'Improvement'}
title: ${locale === 'ko' ? '한국어 제목' : 'English title'}
description: ${locale === 'ko' ? '한국어 설명입니다.' : 'English description.'}
---
${locale === 'ko' ? '첫 문단입니다.\n\n## 자세한 내용\n\n본문입니다.' : 'First paragraph.\n\n## Details\n\nBody copy.'}
`
}

describe('update Markdown content', () => {
  it('loads the published bilingual updates from Markdown files', () => {
    expect(UPDATE_ENTRIES).toHaveLength(2)
    const betaExperience = UPDATE_ENTRIES.find(
      (entry) => entry.id === '2026-08-12-beta-experience',
    )
    const calculatorFlowPolish = UPDATE_ENTRIES.find(
      (entry) => entry.id === '2026-08-16-calculator-flow-polish',
    )

    expect(betaExperience).toMatchObject({
      id: '2026-08-12-beta-experience',
      publishedAt: '2026-08-12',
      content: {
        ko: {
          author: 'LiqGuard 팀',
          release: '2026.08.12',
          type: '개선',
          title: 'LiqGuard 베타 사용 경험을 개선했습니다',
          description: '첫 사용 안내, 계산기 크기 조절 안정성, 공식 문의 경로를 개선했습니다.',
        },
        en: {
          author: 'LiqGuard Team',
          release: '2026.08.12',
          type: 'Improvement',
          title: 'Improved the LiqGuard beta experience',
          description: 'Improved first-use guidance, calculator resizing stability, and the official contact path.',
        },
      },
    })
    expect(betaExperience?.content.ko.body).toContain('## 첫 사용 안내를 더 자연스럽게')
    expect(betaExperience?.content.en.body).toContain('## More natural first-use guidance')
    expect(calculatorFlowPolish).toMatchObject({
      id: '2026-08-16-calculator-flow-polish',
      publishedAt: '2026-08-16',
      content: {
        ko: { title: '계산 흐름과 입력 안내를 더 안정적으로 다듬었습니다' },
        en: { title: 'Polished the calculation flow and input guidance', release: '2026.08.16' },
      },
    })
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
            author: 'LiqGuard 팀',
            release: '2026.08.12',
            type: '개선',
            title: '한국어 제목',
            description: '한국어 설명입니다.',
            body: '첫 문단입니다.\n\n## 자세한 내용\n\n본문입니다.',
          },
          en: {
            author: 'LiqGuard Team',
            release: '2026.08.12',
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

  it('rejects mismatched release numbers across locales', () => {
    expect(() =>
      buildUpdateEntries({
        '/content/updates/sample-update.ko.md': markdown('sample-update', 'ko'),
        '/content/updates/sample-update.en.md': markdown('sample-update', 'en').replace(
          'release: 2026.08.12',
          'release: 2026.08.13',
        ),
      }),
    ).toThrow('release must match across locales')
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
