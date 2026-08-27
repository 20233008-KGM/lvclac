import { isEnglishPublicPath, updateDetailPath, updateIdFromPath } from '../config/routes'
import type { PublicLocale } from '../config/publicPageMetadata'
import type { UpdateEntry } from './updateMarkdown'

export interface UpdateRouteMetadata {
  locale: PublicLocale
  path: string
  koreanPath: string
  englishPath: string
  title: string
  description: string
}

export function resolveUpdateRouteMetadata(
  pathname: string,
  entries: readonly UpdateEntry[],
): UpdateRouteMetadata | null {
  const updateId = updateIdFromPath(pathname)
  if (!updateId) return null

  const entry = entries.find((candidate) => candidate.id === updateId)
  if (!entry) return null

  const locale: PublicLocale = isEnglishPublicPath(pathname) ? 'en' : 'ko'
  const content = entry.content[locale]

  return {
    locale,
    path: updateDetailPath(updateId, locale),
    koreanPath: updateDetailPath(updateId, 'ko'),
    englishPath: updateDetailPath(updateId, 'en'),
    title: `${content.release ?? content.type} · ${content.title}`,
    description: content.description,
  }
}
