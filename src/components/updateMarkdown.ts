export type UpdateLocale = 'ko' | 'en'

export interface UpdateEntryContent {
  type: string
  title: string
  description: string
  body: string
}
export interface UpdateEntry {
  id: string
  publishedAt: string
  content: Record<UpdateLocale, UpdateEntryContent>
}

interface ParsedUpdateMarkdown {
  id: string
  publishedAt: string
  locale: UpdateLocale
  content: UpdateEntryContent
}

const UPDATE_FRONTMATTER_KEYS = new Set([
  'id',
  'publishedAt',
  'locale',
  'type',
  'title',
  'description',
])

function updateMarkdownError(path: string, message: string): Error {
  return new Error(`Invalid update Markdown (${path}): ${message}`)
}

function isValidPublishedAt(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function parseUpdateMarkdown(path: string, source: string): ParsedUpdateMarkdown {
  const normalized = source.replace(/\r\n/g, '\n')
  if (!normalized.startsWith('---\n')) {
    throw updateMarkdownError(path, 'frontmatter must start with ---')
  }

  const closingDelimiterIndex = normalized.indexOf('\n---\n', 4)
  if (closingDelimiterIndex === -1) {
    throw updateMarkdownError(path, 'frontmatter must end with ---')
  }

  const fields = new Map<string, string>()
  const frontmatter = normalized.slice(4, closingDelimiterIndex)

  for (const line of frontmatter.split('\n')) {
    if (!line.trim()) continue
    const separatorIndex = line.indexOf(':')
    if (separatorIndex <= 0) {
      throw updateMarkdownError(path, `invalid frontmatter line: ${line}`)
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    if (!UPDATE_FRONTMATTER_KEYS.has(key)) {
      throw updateMarkdownError(path, `unsupported frontmatter field: ${key}`)
    }
    if (!value) throw updateMarkdownError(path, `${key} must not be empty`)
    if (fields.has(key)) {
      throw updateMarkdownError(path, `duplicate frontmatter field: ${key}`)
    }
    fields.set(key, value)
  }

  for (const key of UPDATE_FRONTMATTER_KEYS) {
    if (!fields.has(key)) {
      throw updateMarkdownError(path, `missing frontmatter field: ${key}`)
    }
  }

  const id = fields.get('id') as string
  const publishedAt = fields.get('publishedAt') as string
  const locale = fields.get('locale') as string
  const type = fields.get('type') as string
  const title = fields.get('title') as string
  const description = fields.get('description') as string
  const body = normalized.slice(closingDelimiterIndex + '\n---\n'.length).trim()

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw updateMarkdownError(path, 'id must be a lowercase kebab-case value')
  }
  if (!isValidPublishedAt(publishedAt)) {
    throw updateMarkdownError(path, 'publishedAt must be a valid YYYY-MM-DD date')
  }
  if (locale !== 'ko' && locale !== 'en') {
    throw updateMarkdownError(path, 'locale must be ko or en')
  }
  if (!body) throw updateMarkdownError(path, 'body must not be empty')

  const expectedFilename = `${id}.${locale}.md`
  const filename = path.replace(/\\/g, '/').split('/').pop()
  if (filename !== expectedFilename) {
    throw updateMarkdownError(path, `filename must be ${expectedFilename}`)
  }

  return {
    id,
    publishedAt,
    locale,
    content: { type, title, description, body },
  }
}

export function buildUpdateEntries(
  documents: Readonly<Record<string, string>>,
): readonly UpdateEntry[] {
  const grouped = new Map<string, Partial<Record<UpdateLocale, ParsedUpdateMarkdown>>>()

  for (const [path, source] of Object.entries(documents)) {
    const parsed = parseUpdateMarkdown(path, source)
    const localized = grouped.get(parsed.id) ?? {}
    if (localized[parsed.locale]) {
      throw updateMarkdownError(path, `duplicate ${parsed.locale} document for ${parsed.id}`)
    }
    localized[parsed.locale] = parsed
    grouped.set(parsed.id, localized)
  }

  return [...grouped.entries()].map(([id, localized]) => {
    const ko = localized.ko
    const en = localized.en
    if (!ko || !en) {
      const missingLocale = ko ? 'en' : 'ko'
      throw new Error(`Invalid update Markdown (${id}): missing ${missingLocale} document`)
    }
    if (ko.publishedAt !== en.publishedAt) {
      throw new Error(`Invalid update Markdown (${id}): publishedAt must match across locales`)
    }

    return {
      id,
      publishedAt: ko.publishedAt,
      content: {
        ko: ko.content,
        en: en.content,
      },
    }
  })
}
