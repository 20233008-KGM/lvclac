import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

describe('mark and order price link UI', () => {
  it('adds a pressed-state link control to the current-price field', () => {
    const inputPanel = source('src/components/InputPanel.tsx')

    expect(inputPanel).toContain("onChange({ setOrderPriceLink: !orderPriceLinked })")
    expect(inputPanel).toContain('aria-pressed={orderPriceLinked}')
    expect(inputPanel).toContain('current-price-link-btn')
    expect(inputPanel).toContain('<span aria-hidden="true">🔗</span>')
  })

  it('swaps the order-price 현 button to a link while linked', () => {
    const resultPanel = source('src/components/ResultPanel.tsx')

    expect(resultPanel).toContain(
      'orderPriceLinked ? <span aria-hidden="true">🔗</span> : useCurrentPriceShort',
    )
    expect(resultPanel).toContain("onChange({ setOrderPriceLink: false })")
    expect(resultPanel).toContain('price-link-inline-btn--active')
  })

  it('uses a static glow without changing the control width', () => {
    const css = source('src/App.css')

    expect(css).toContain('.order-mark-inline-btn.price-link-inline-btn--active')
    expect(css).toContain('0 0 11px')
    expect(css).toContain('.current-price-link-row')
    expect(css).not.toContain('@keyframes price-link')
  })
})
