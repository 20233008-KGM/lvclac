import { Fragment } from 'react'

interface TooltipBodyProps {
  text: string
  guideHref?: string
  guideLinkLabel?: string
}

type TooltipBlock =
  | { type: 'title'; text: string }
  | { type: 'sentence'; text: string }
  | { type: 'line'; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'divider' }
  | { type: 'label'; text: string; variant: LabelVariant }
  | { type: 'shortcut'; key: string; action: string }

type LabelVariant = 'default' | 'keys' | 'tip' | 'warning'

const SECTION_ICON: Record<string, string> = {
  단축키: '⌨️ ',
  Shortcuts: '⌨️ ',
  추천: '✨ ',
  '효율적인 사용 팁': '✨ ',
  Tip: '✨ ',
  참고: 'ℹ️ ',
  Note: 'ℹ️ ',
  주의: '⚠️ ',
  주의사항: '⚠️ ',
  Warning: '⚠️ ',
  '일상 갱신': '📅 ',
  '최초 입력': '📝 ',
}

function labelVariant(text: string): LabelVariant {
  if (text.includes('단축키') || text.includes('Shortcut')) return 'keys'
  if (text.includes('주의') || text.includes('Warning')) return 'warning'
  if (text.includes('추천') || text.includes('효율') || text.includes('Tip')) return 'tip'
  return 'default'
}

function isDividerLine(line: string): boolean {
  const trimmed = line.trim()
  return /^[─\-]{4,}$/.test(trimmed)
}

function parseSectionLabel(line: string): string | null {
  const match = line.trim().match(/^\[(.+)\]$/)
  return match ? match[1] : null
}

function parseShortcut(line: string): { key: string; action: string } | null {
  const trimmed = line.trim()
  const match = trimmed.match(/^(.+?)\s*→\s*(.+)$/)
  if (!match) return null
  const key = match[1].trim()
  const action = match[2].trim()
  // 본문 속 "Enter (1회) → Enter (2회) 하면 …" 같은 문장은 단축키 행으로 취급하지 않음
  if (key.length > 32 || action.length > 32) return null
  if (/하면|합니다|됩니다|세요|\.|\?|。/.test(action)) return null
  return { key, action }
}

function isListOrLabelLine(line: string): boolean {
  const trimmed = line.trim()
  return (
    trimmed === '단축키' ||
    trimmed === 'Shortcuts' ||
    /^[·•]/.test(trimmed) ||
    /^[※💡]/.test(trimmed) ||
    /^\(.+\)$/.test(trimmed)
  )
}

function parseParagraph(paragraph: string): TooltipBlock[] {
  return paragraph
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => {
      if (line.startsWith('# ')) {
        return { type: 'title' as const, text: line.slice(2).trim() }
      }

      if (isDividerLine(line)) return { type: 'divider' as const }

      const label = parseSectionLabel(line)
      if (label) {
        return { type: 'label' as const, text: label, variant: labelVariant(label) }
      }

      const shortcut = parseShortcut(line)
      if (shortcut) return { type: 'shortcut' as const, ...shortcut }

      const trimmed = line.trim()
      if (trimmed.startsWith('- ')) {
        return { type: 'bullet' as const, text: trimmed.slice(2) }
      }

      return isListOrLabelLine(line)
        ? { type: 'line' as const, text: line }
        : { type: 'sentence' as const, text: line }
    })
}

function ShortcutKeys({ keyText }: { keyText: string }) {
  const noteMatch = keyText.match(/^(.+?)(\s*\([^)]+\))$/)
  const base = noteMatch ? noteMatch[1].trim() : keyText
  const note = noteMatch ? noteMatch[2].trim() : null
  const parts = base.split(/\s*\+\s*/)

  return (
    <span className="tooltip-body__shortcut-keys">
      {parts.map((part, index) => (
        <Fragment key={`${part}-${index}`}>
          {index > 0 && <span className="tooltip-body__shortcut-plus">+</span>}
          <kbd className="tooltip-body__kbd">{part}</kbd>
        </Fragment>
      ))}
      {note && <span className="tooltip-body__shortcut-note">{note}</span>}
    </span>
  )
}

/** 툴팁 본문 — 고정 너비, `\n` 의미 단위 줄바꿈, `\n\n` 문단 구분 */
export function TooltipBody({ text, guideHref, guideLinkLabel }: TooltipBodyProps) {
  const paragraphs = text.trim().split(/\n\n+/)

  return (
    <span className="tooltip-body">
      {paragraphs.map((paragraph, paragraphIndex) => (
        <span key={`paragraph-${paragraphIndex}`} className="tooltip-body__paragraph">
          {parseParagraph(paragraph).map((block, blockIndex) => {
            switch (block.type) {
              case 'title':
                return (
                  <span key={`title-${blockIndex}`} className="tooltip-body__title">
                    {block.text}
                  </span>
                )
              case 'divider':
                return (
                  <span
                    key={`divider-${blockIndex}`}
                    className="tooltip-body__divider"
                    role="presentation"
                  />
                )
              case 'label':
                return (
                  <span
                    key={`label-${blockIndex}`}
                    className={`tooltip-body__label tooltip-body__label--${block.variant}`}
                  >
                    {SECTION_ICON[block.text] ?? ''}
                    {block.text}
                  </span>
                )
              case 'shortcut':
                return (
                  <span key={`shortcut-${blockIndex}`} className="tooltip-body__shortcut">
                    <ShortcutKeys keyText={block.key} />
                    <span className="tooltip-body__shortcut-action">{block.action}</span>
                  </span>
                )
              case 'bullet':
                return (
                  <span key={`bullet-${blockIndex}`} className="tooltip-body__bullet">
                    <span className="tooltip-body__bullet-mark" aria-hidden>
                      ·
                    </span>
                    <span className="tooltip-body__bullet-text">{block.text}</span>
                  </span>
                )
              case 'line':
                return (
                  <span key={`line-${blockIndex}`} className="tooltip-body__line">
                    {block.text}
                  </span>
                )
              default:
                return (
                  <span key={`sentence-${blockIndex}`} className="tooltip-body__sentence">
                    {block.text}
                  </span>
                )
            }
          })}
        </span>
      ))}
      {guideHref && guideLinkLabel && (
        <a className="tooltip-body__guide-link" href={guideHref}>
          {guideLinkLabel}
        </a>
      )}
    </span>
  )
}
