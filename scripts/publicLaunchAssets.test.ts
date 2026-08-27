import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  adsensePublisherId,
  adsTxtContent,
  transformPublicIndexHtml,
} from './publicLaunchAssets'

const privateIndex = `<html><head>
<!-- 정식 공개 전까지 검색엔진 색인 차단. 공개 시 이 줄을 제거한다. -->
<meta name="robots" content="noindex, nofollow" />
</head></html>`

describe('public launch assets', () => {
  it('removes the static noindex marker only when launch indexing is enabled', () => {
    expect(
      transformPublicIndexHtml(privateIndex, { allowIndexing: true }),
    ).not.toContain('noindex')
    expect(
      transformPublicIndexHtml('<html><head></head></html>', {
        allowIndexing: false,
      }),
    ).toContain('name="robots" content="noindex, nofollow"')
  })

  it('creates the AdSense account meta and ads.txt from an exact client ID', () => {
    const clientId = 'ca-pub-1234567890123456'
    const html = transformPublicIndexHtml(privateIndex, {
      allowIndexing: true,
      adsenseClient: clientId,
    })

    expect(adsensePublisherId(clientId)).toBe('1234567890123456')
    expect(html).toContain(
      '<meta name="google-adsense-account" content="ca-pub-1234567890123456" />',
    )
    expect(adsTxtContent(clientId)).toBe(
      'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n',
    )
  })

  it('does not publish malformed AdSense identifiers', () => {
    expect(adsensePublisherId('pub-123')).toBeNull()
    expect(adsTxtContent('ca-pub-not-a-number')).toBeNull()
    expect(
      transformPublicIndexHtml(privateIndex, {
        allowIndexing: true,
        adsenseClient: 'ca-pub-not-a-number',
      }),
    ).not.toContain('google-adsense-account')
  })

  it('blocks all crawlers while Preview indexing and advertising are disabled', () => {
    const robots = readFileSync(resolve('public/robots.txt'), 'utf8').replace(/\r\n/g, '\n')

    expect(robots).toContain('User-agent: *\nDisallow: /')
    expect(robots).not.toContain('Mediapartners-Google')
  })
})
