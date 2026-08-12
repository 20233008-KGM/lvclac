import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PUBLIC_PAGE_PATHS,
  publicPageMetadata,
  type PublicPagePath,
} from '../src/config/publicPageMetadata'

export interface PublicRouteSeoOptions {
  path: PublicPagePath
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

export function publicRouteAssetName(path: PublicPagePath): string {
  return path === '/' ? 'index.html' : `${path.slice(1)}.html`
}

export function publicRouteRewrites(): Array<{ source: string; destination: string }> {
  return PUBLIC_PAGE_PATHS.filter((path) => path !== '/').map((path) => ({
    source: path,
    destination: `/${publicRouteAssetName(path)}`,
  }))
}

export function transformPublicRouteHtml(
  html: string,
  { path, siteUrl }: PublicRouteSeoOptions,
): string {
  const metadata = publicPageMetadata('ko', path)
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '')
  const canonicalUrl = path === '/' ? normalizedSiteUrl : `${normalizedSiteUrl}${path}`
  const title = escapeHtml(metadata.title)
  const description = escapeHtml(metadata.description)
  const canonical = escapeHtml(canonicalUrl)

  let next = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
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

  return next
}

export function writePublicRouteHtmlAssets(outputDir: string, siteUrl: string): void {
  const indexPath = resolve(outputDir, 'index.html')
  const baseHtml = readFileSync(indexPath, 'utf8')

  for (const path of PUBLIC_PAGE_PATHS) {
    const routeHtml = transformPublicRouteHtml(baseHtml, { path, siteUrl })
    writeFileSync(resolve(outputDir, publicRouteAssetName(path)), routeHtml, 'utf8')
  }
}

export { PUBLIC_PAGE_PATHS }
