interface TooltipBodyProps {
  text: string
}

type TooltipBlock =
  | { type: 'sentence'; text: string }
  | { type: 'line'; text: string }

function isListOrLabelLine(line: string): boolean {
  const trimmed = line.trim()
  return (
    trimmed === '단축키' ||
    trimmed === 'Shortcuts' ||
    /^[·•]/.test(trimmed) ||
    /^[※💡]/.test(trimmed)
  )
}

function parseParagraph(paragraph: string): TooltipBlock[] {
  return paragraph
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) =>
      isListOrLabelLine(line)
        ? { type: 'line' as const, text: line }
        : { type: 'sentence' as const, text: line },
    )
}

/** 툴팁 본문 — 고정 너비, `\n` 문장 구분, `\n\n` 문단 구분 */
export function TooltipBody({ text }: TooltipBodyProps) {
  const paragraphs = text.trim().split(/\n\n+/)

  return (
    <span className="tooltip-body">
      {paragraphs.map((paragraph, paragraphIndex) => (
        <span key={`paragraph-${paragraphIndex}`} className="tooltip-body__paragraph">
          {parseParagraph(paragraph).map((block, blockIndex) =>
            block.type === 'sentence' ? (
              <span key={`sentence-${blockIndex}`} className="tooltip-body__sentence">
                {block.text}
              </span>
            ) : (
              <span key={`line-${blockIndex}`} className="tooltip-body__line">
                {block.text}
              </span>
            ),
          )}
        </span>
      ))}
    </span>
  )
}
