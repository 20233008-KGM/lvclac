import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PUBLIC_PAGE_VARIANTS,
  publicPageMetadata,
  publicPageVariant,
} from '../src/config/publicPageMetadata'
import { localizedPublicPath } from '../src/config/routes'

export interface PublicRouteSeoOptions {
  path: string
  siteUrl: string
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
  return PUBLIC_PAGE_VARIANTS.filter(({ path }) => path !== '/').map(({ path }) => ({
    source: path,
    destination: `/${publicRouteAssetName(path)}`,
  }))
}

export function transformPublicRouteHtml(
  html: string,
  { path, siteUrl }: PublicRouteSeoOptions,
): string {
  const variant = publicPageVariant(path)
  const metadata = publicPageMetadata(variant.locale, variant.basePath)
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '')
  const canonicalUrl = variant.path === '/'
    ? normalizedSiteUrl
    : `${normalizedSiteUrl}${variant.path}`
  const koreanPath = localizedPublicPath(variant.basePath, 'ko')
  const englishPath = localizedPublicPath(variant.basePath, 'en')
  const koreanUrl = koreanPath === '/' ? normalizedSiteUrl : `${normalizedSiteUrl}${koreanPath}`
  const englishUrl = `${normalizedSiteUrl}${englishPath}`
  const title = escapeHtml(metadata.title)
  const description = escapeHtml(metadata.description)
  const canonical = escapeHtml(canonicalUrl)

  let next = html
    .replace(/<html\s+lang=["'][^"']*["']/i, `<html lang="${variant.locale}"`)
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
    `<meta property="og:locale" content="${variant.locale === 'ko' ? 'ko_KR' : 'en_US'}" />`,
  )
  next = upsertMeta(
    next,
    /<meta\s+property=["']og:locale:alternate["'][^>]*>/i,
    `<meta property="og:locale:alternate" content="${variant.locale === 'ko' ? 'en_US' : 'ko_KR'}" />`,
  )

  return next
}

export function writePublicRouteHtmlAssets(outputDir: string, siteUrl: string): void {
  const indexPath = resolve(outputDir, 'index.html')
  const baseHtml = readFileSync(indexPath, 'utf8')

  for (const { path } of PUBLIC_PAGE_VARIANTS) {
    const routeHtml = transformPublicRouteHtml(baseHtml, { path, siteUrl })
    writeFileSync(resolve(outputDir, publicRouteAssetName(path)), routeHtml, 'utf8')
  }
}

export { PUBLIC_PAGE_VARIANTS }
