import type { Locale } from '../i18n'

export interface UpdateEntryContent {
  type: string
  title: string
  summary: string
}

export interface UpdateEntry {
  id: string
  publishedAt: string
  content: Record<Locale, UpdateEntryContent>
}

// Add only published, user-facing updates here. Preview and test entries belong in tests.
export const UPDATE_ENTRIES: readonly UpdateEntry[] = []
