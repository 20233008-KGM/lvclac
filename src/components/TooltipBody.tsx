interface TooltipBodyProps {
  text: string
}

type TooltipBlock =
  | { type: 'sentence'; text: string }
  | { type: 'line'; text: string }
  | { type: 'divider' }
  | { type: 'label'; text: string }
  | { type: 'shortcut'; key: string; action: string }

function isDividerLine(line: string): boolean {
  const trimmed = line.trim()
  return /^[─\-]{4,}$/.test(trimmed)
}

function parseSectionLabel(line: string): string | null {
  const match = line.trim().match(/^\[(.+)\]$/)
  return match ? match[1] : null
}

function parseShortcut(line: string): { key: string; action: string } | null {
  const match = line.trim().match(/^(.+?)\s*→\s*(.+)$/)
  return match ? { key: match[1].trim(), action: match[2].trim() } : null
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
      if (isDividerLine(line)) return { type: 'divider' as const }

      const label = parseSectionLabel(line)
      if (label) return { type: 'label' as const, text: label }

      const shortcut = parseShortcut(line)
      if (shortcut) return { type: 'shortcut' as const, ...shortcut }

      return isListOrLabelLine(line)
        ? { type: 'line' as const, text: line }
        : { type: 'sentence' as const, text: line }
    })
}

/** 툴팁 본문 — 고정 너비, `\n` 의미 단위 줄바꿈, `\n\n` 문단 구분 */
export function TooltipBody({ text }: TooltipBodyProps) {
  const paragraphs = text.trim().split(/\n\n+/)

  return (
    <span className="tooltip-body">
      {paragraphs.map((paragraph, paragraphIndex) => (
        <span key={`paragraph-${paragraphIndex}`} className="tooltip-body__paragraph">
          {parseParagraph(paragraph).map((block, blockIndex) => {
            switch (block.type) {
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
                  <span key={`label-${blockIndex}`} className="tooltip-body__label">
                    {block.text}
                  </span>
                )
              case 'shortcut':
                return (
                  <span key={`shortcut-${blockIndex}`} className="tooltip-body__shortcut">
                    <span className="tooltip-body__shortcut-key">{block.key}</span>
                    <span className="tooltip-body__shortcut-action">{block.action}</span>
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
    </span>
  )
}
