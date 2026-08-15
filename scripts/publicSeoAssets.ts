import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PUBLIC_PAGE_VARIANTS,
  publicPageMetadata,
  publicPageVariant,
} from '../src/config/publicPageMetadata'
import { localizedPublicPath, updateDetailPath } from '../src/config/routes'
import { buildUpdateEntries, type UpdateEntry } from '../src/components/updateMarkdown'
import { resolveUpdateRouteMetadata } from '../src/components/updateRouteMetadata'

export interface PublicRouteSeoOptions {
  path: string
  siteUrl: string
  updateEntries?: readonly UpdateEntry[]
}

export function publishedUpdateEntries(): readonly UpdateEntry[] {
  const contentDirectory = resolve('content/updates')
  const documents = Object.fromEntries(
    readdirSync(contentDirectory)
      .filter((filename) => filename.endsWith('.md'))
      .map((filename) => [
        resolve(contentDirectory, filename),
        readFileSync(resolve(contentDirectory, filename), 'utf8'),
      ]),
  )
  return buildUpdateEntries(documents)
}

export function publicRouteVariants(
  updateEntries: readonly UpdateEntry[] = publishedUpdateEntries(),
): Array<{ path: string }> {
  const updatePaths = updateEntries.flatMap(({ id }) => [
    { path: updateDetailPath(id, 'ko') },
    { path: updateDetailPath(id, 'en') },
  ])
  return [...PUBLIC_PAGE_VARIANTS, ...updatePaths]
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function upsertMeta(
  html: string,
  selectorPattern: RegExp,
  element: string,
): string {
  if (selectorPattern.test(html)) return html.replace(selectorPattern, element)
  return html.replace('</head>', `    ${element}\n  </head>`)
}

export function publicRouteAssetName(path: string): string {
  return path === '/' ? 'index.html' : `${path.slice(1).replaceAll('/', '-')}.html`
}

export function publicRouteRewrites(): Array<{ source: string; destination: string }> {
  return [
    ...PUBLIC_PAGE_VARIANTS.filter(({ path }) => path !== '/').map(({ path }) => ({
      source: path,
      destination: `/${publicRouteAssetName(path)}`,
    })),
    {
      source: '/updates/:updateId',
      destination: '/updates-:updateId.html',
    },
    {
      source: '/en/updates/:updateId',
      destination: '/en-updates-:updateId.html',
    },
  ]
}

export function transformPublicRouteHtml(
  html: string,
  { path, siteUrl, updateEntries }: PublicRouteSeoOptions,
): string {
  const updateRoute = resolveUpdateRouteMetadata(
    path,
    updateEntries ?? publishedUpdateEntries(),
  )
  const variant = publicPageVariant(path)
  const metadata = updateRoute ?? publicPageMetadata(variant.locale, variant.basePath)
  const locale = updateRoute?.locale ?? variant.locale
  const canonicalPath = updateRoute?.path ?? variant.path
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '')
  const canonicalUrl = canonicalPath === '/'
    ? normalizedSiteUrl
    : `${normalizedSiteUrl}${canonicalPath}`
  const koreanPath = updateRoute?.koreanPath ?? localizedPublicPath(variant.basePath, 'ko')
  const englishPath = updateRoute?.englishPath ?? localizedPublicPath(variant.basePath, 'en')
  const koreanUrl = koreanPath === '/' ? normalizedSiteUrl : `${normalizedSiteUrl}${koreanPath}`
  const englishUrl = `${normalizedSiteUrl}${englishPath}`
  const title = escapeHtml(metadata.title)
  const description = escapeHtml(metadata.description)
  const canonical = escapeHtml(canonicalUrl)

  let next = html
    .replace(/<html\s+lang=["'][^"']*["']/i, `<html lang="${locale}"`)
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
  next = upsertMeta(
    next,
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${description}" />`,
  )
  next = upsertMeta(
    next,
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${title}" />`,
  )
  next = upsertMeta(
    next,
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${description}" />`,
  )
  next = upsertMeta(
    next,
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${canonical}" />`,
  )
  next = upsertMeta(
    next,
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${canonical}" />`,
  )
  next = upsertMeta(
    next,
    /<link\s+rel=["']alternate["']\s+hreflang=["']ko["'][^>]*>/i,
    `<link rel="alternate" hreflang="ko" href="${escapeHtml(koreanUrl)}" />`,
  )
  next = upsertMeta(
    next,
    /<link\s+rel=["']alternate["']\s+hreflang=["']en["'][^>]*>/i,
    `<link rel="alternate" hreflang="en" href="${escapeHtml(englishUrl)}" />`,
  )
  next = upsertMeta(
    next,
    /<link\s+rel=["']alternate["']\s+hreflang=["']x-default["'][^>]*>/i,
    `<link rel="alternate" hreflang="x-default" href="${escapeHtml(koreanUrl)}" />`,
  )
  next = upsertMeta(
    next,
    /<meta\s+property=["']og:locale["'][^>]*>/i,
    `<meta property="og:locale" content="${locale === 'ko' ? 'ko_KR' : 'en_US'}" />`,
  )
  next = upsertMeta(
    next,
    /<meta\s+property=["']og:locale:alternate["'][^>]*>/i,
    `<meta property="og:locale:alternate" content="${locale === 'ko' ? 'en_US' : 'ko_KR'}" />`,
  )

  return next
}

export function writePublicRouteHtmlAssets(outputDir: string, siteUrl: string): void {
  const indexPath = resolve(outputDir, 'index.html')
  const baseHtml = readFileSync(indexPath, 'utf8')
  const updateEntries = publishedUpdateEntries()

  for (const { path } of publicRouteVariants(updateEntries)) {
    const routeHtml = transformPublicRouteHtml(baseHtml, {
      path,
      siteUrl,
      updateEntries,
    })
    writeFileSync(resolve(outputDir, publicRouteAssetName(path)), routeHtml, 'utf8')
  }

  const sitemapPath = resolve(outputDir, 'sitemap.xml')
  if (existsSync(sitemapPath)) {
    const sitemap = readFileSync(sitemapPath, 'utf8')
    writeFileSync(
      sitemapPath,
      appendUpdateRoutesToSitemap(sitemap, siteUrl, updateEntries),
      'utf8',
    )
  }
}

export function appendUpdateRoutesToSitemap(
  sitemap: string,
  siteUrl: string,
  updateEntries: readonly UpdateEntry[],
): string {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '')
  const updateUrls = updateEntries.flatMap(({ id, publishedAt }) =>
    (['ko', 'en'] as const).map((locale) => {
      const path = updateDetailPath(id, locale)
      const url = `${normalizedSiteUrl}${path}`
      if (sitemap.includes(`<loc>${url}</loc>`)) return ''
      return [
        '  <url>',
        `    <loc>${escapeHtml(url)}</loc>`,
        `    <lastmod>${publishedAt}</lastmod>`,
        '    <changefreq>monthly</changefreq>',
        '    <priority>0.6</priority>',
        '  </url>',
      ].join('\n')
    }),
  ).filter(Boolean)

  if (updateUrls.length === 0) return sitemap
  return sitemap.replace('</urlset>', `${updateUrls.join('\n')}\n</urlset>`)
}

export { PUBLIC_PAGE_VARIANTS }
