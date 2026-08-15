import { buildUpdateEntries } from './updateMarkdown'
import type { UpdateEntry } from './updateMarkdown'

export { buildUpdateEntries }
export type { UpdateEntry, UpdateEntryContent } from './updateMarkdown'

// Only published, user-facing updates belong in content/updates.
const updateMarkdownModules = import.meta.glob('../../content/updates/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>

export const UPDATE_ENTRIES: readonly UpdateEntry[] = buildUpdateEntries(
  updateMarkdownModules,
)
