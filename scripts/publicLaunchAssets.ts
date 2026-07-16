export interface PublicLaunchAssetOptions {
  allowIndexing: boolean
  adsenseClient?: string
}

const STATIC_NOINDEX_PATTERN =
  /\s*<!-- 정식 공개 전까지 검색엔진 색인 차단\. 공개 시 이 줄을 제거한다\. -->\s*<meta name="robots" content="noindex, nofollow" \/>/

export function adsensePublisherId(clientId: string | undefined): string | null {
  const match = clientId?.trim().match(/^ca-pub-(\d+)$/)
  return match?.[1] ?? null
}

export function adsTxtContent(clientId: string | undefined): string | null {
  const publisherId = adsensePublisherId(clientId)
  return publisherId
    ? `google.com, pub-${publisherId}, DIRECT, f08c47fec0942fa0\n`
    : null
}

export function transformPublicIndexHtml(
  html: string,
  { allowIndexing, adsenseClient }: PublicLaunchAssetOptions,
): string {
  let next = allowIndexing ? html.replace(STATIC_NOINDEX_PATTERN, '') : html

  if (!allowIndexing && !next.includes('name="robots"')) {
    next = next.replace(
      '<head>',
      '<head>\n    <meta name="robots" content="noindex, nofollow" />',
    )
  }

  const clientId = adsenseClient?.trim()
  if (
    adsensePublisherId(clientId) &&
    clientId &&
    !next.includes('name="google-adsense-account"')
  ) {
    next = next.replace(
      '</head>',
      `    <meta name="google-adsense-account" content="${clientId}" />\n  </head>`,
    )
  }

  return next
}
