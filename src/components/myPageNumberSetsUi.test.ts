import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { CalculatorNumberSet } from '../context/CalculatorContext'
import { en } from '../i18n/locales/en'
import { ko } from '../i18n/locales/ko'
import { defaultInputs } from '../types'
import { NumberSetPreferencesPanel } from './MyPage'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

const noop = () => {}
function numberSet(
  id: string,
  storageMode: 'local' | 'cloud',
  autoSnapshotEnabled = false,
): CalculatorNumberSet {
  return {
    id,
    title: `${storageMode}-${id}`,
    inputs: defaultInputs,
    presetId: id.endsWith('1') ? 'stock' : 'index',
    updatedAt: null,
    storageMode,
    autoSnapshotEnabled,
  }
}

function renderPanel(locale: 'ko' | 'en', isPro: boolean, hasEnabledCloudSet = true) {
  const messages = locale === 'ko' ? ko : en
  const copy = messages.myPage
  return renderToStaticMarkup(
    createElement(NumberSetPreferencesPanel, {
      copy,
      presetCopy: messages.glossaryPreset,
      localNumberSets: [numberSet('local-1', 'local')],
      cloudNumberSets: [
        numberSet('cloud-1', 'cloud', hasEnabledCloudSet),
        numberSet('cloud-2', 'cloud'),
      ],
      numberSetLimits: { local: 10, cloud: 10 },
      busy: false,
      notice: null,
      isPro,
      onCreateNumberSet: noop,
      onRenameNumberSet: noop,
      onSetPreset: noop,
      onDeleteNumberSet: noop,
      onSetAutoSnapshot: noop,
    }),
  )
}

describe('my page number-set management UI', () => {
  it('provides a standalone number-set panel with per-location groups', () => {
    const text = source('src/components/MyPage.tsx')
    const css = source('src/styles/pages.css')
    const variables = source('src/styles/variables.css')

    expect(text).toContain('NumberSetPreferencesPanel')
    expect(text).toContain('copy.numberSetsTitle')
    expect(text).toContain('localNumberSets')
    expect(text).toContain('cloudNumberSets')
    expect(text).toContain('onCreateNumberSet')
    expect(text).toContain('onRenameNumberSet')
    expect(text).toContain('onDeleteNumberSet')
    // v3 리디자인: 불러오기 액션은 계산기 쪽 숫자세트 선택기로 일원화, 행 액션은 상세보기+삭제.
    expect(text).toContain('numberSetDetails')
    expect(css).toContain('.my-page-number-sets')
    expect(css).toContain('.my-page-number-set-row')
    expect(css).toContain('.my-page-number-set-groups')
    const groupsRule = css.match(/\.my-page-number-set-groups\s*\{([^}]*)\}/)?.[1]
    expect(groupsRule).toContain('grid-template-columns: 1fr')
    expect(groupsRule).not.toContain('repeat(2')
    const rowRule = css.match(/\.my-page-number-set-row\s*\{([^}]*)\}/)?.[1]
    expect(variables).toContain('--mypage-control-width: 176px')
    expect(variables).toContain('--mypage-instrument-width: 160px')
    expect(variables).toContain('--mypage-automation-width: 40px')
    expect(rowRule).toContain('grid-template-columns: var(--mypage-control-width) minmax(0, 1fr) var(--mypage-automation-width) var(--mypage-instrument-width) 70px')
    expect(css).toContain('.my-page-number-set-list-head span:nth-child(2)')
    expect(css).toContain('grid-column: 5')
    expect(css).toMatch(/\.my-page-number-set-row-auto\s*\{[\s\S]*?grid-column: 3;[\s\S]*?justify-self: start;/)
    expect(css).toContain('grid-template-columns: repeat(4, minmax(0, 1fr))')
  })

  it('renders the daily-record switch column in each Pro cloud slot row', () => {
    const koHtml = renderPanel('ko', true)
    const enHtml = renderPanel('en', true)

    expect(koHtml).toContain(ko.myPage.autoSnapshotSlotHelp)
    expect(koHtml.match(/my-page-number-set-list-head/g)).toHaveLength(2)
    expect(koHtml).toContain('자동 기록')
    expect(koHtml.match(/거래종목/g)).toHaveLength(2)
    expect(koHtml.match(/type="checkbox"/g)).toHaveLength(2)
    expect(koHtml.match(/checked=""/g)).toHaveLength(1)
    expect(koHtml).not.toContain('disabled=""')
    expect(koHtml).toContain('toggle-switch__track')
    expect(koHtml).not.toContain('my-page-number-set-row--auto-selected')
    expect(koHtml).toContain('cloud-cloud-1: 매일 기록')
    expect(koHtml).toContain('매일 기록 중: 클라우드 세트 1개')
    expect(enHtml).toContain(en.myPage.autoSnapshotSlotHelp)
    expect(enHtml.match(/my-page-number-set-list-head/g)).toHaveLength(2)
    expect(enHtml).toContain('Auto record')
    expect(enHtml).toContain('Instrument')
    expect(enHtml).toContain('cloud-cloud-1: Record daily')
    expect(enHtml).toContain('Recording daily: 1 cloud set(s)')
  })

  it('keeps daily-record guidance and controls out of local and inactive free sets', () => {
    const html = renderPanel('ko', false, false)

    expect(html).not.toContain(ko.myPage.autoSnapshotSlotHelp)
    expect(html).not.toContain('매일 기록 중')
    expect(html.match(/my-page-number-set-list-head/g)).toHaveLength(2)
    expect(html).not.toContain('자동 기록')
    expect(html.match(/거래종목/g)).toHaveLength(2)
    expect(html).not.toContain('type="checkbox"')
    expect(html).toContain(`local-local-1: ${ko.glossaryPreset.label}`)
  })

  it('keeps an already-enabled free cloud set removable without enabling inactive rows', () => {
    const html = renderPanel('ko', false, true)

    expect(html.match(/my-page-number-set-list-head/g)).toHaveLength(2)
    expect(html).toContain('자동 기록')
    expect(html.match(/type="checkbox"/g)).toHaveLength(1)
    expect(html).toContain('checked=""')
    expect(html).toContain('my-page-number-set-row-auto--empty')
  })

  it('keeps the daily-record switch in the first row without selected-row styling', () => {
    const component = source('src/components/MyPage.tsx')
    const css = source('src/styles/pages.css')

    expect(component).toContain('<ToggleSwitch')
    expect(component).toContain('onSetAutoSnapshot(numberSet.storageMode, numberSet.id, enabled)')
    expect(component).toContain('my-page-number-set-row-switch-label')
    expect(component).toMatch(/value=\{titleDraft\}[\s\S]*my-page-number-set-row-auto[\s\S]*my-page-number-set-row-actions/)
    expect(css).toContain('grid-row: 2')
    expect(css).not.toContain('.my-page-number-set-row--auto-selected')
    expect(css).not.toContain('@media (max-width: 420px)')
  })

  it('renders a terminology preset selector in every local and cloud slot', () => {
    const html = renderPanel('ko', true)

    expect(html.match(/my-page-number-set-row-preset/g)).toHaveLength(3)
    expect(html).toContain(`local-local-1: ${ko.glossaryPreset.label}`)
    expect(html).toContain(`cloud-cloud-1: ${ko.glossaryPreset.label}`)
    expect(html).toContain('value="stock" selected=""')
    expect(html).toContain('value="index" selected=""')
  })

  it('removes the former global terminology preference and routes a slot selector to its exact id', () => {
    const component = source('src/components/MyPage.tsx')

    expect(component).not.toContain('<PresetSelect variant="inline" />')
    expect(component).toMatch(/onSetPreset\(\r?\n\s+numberSet\.storageMode,\r?\n\s+numberSet\.id,/)
    expect(component).toContain('setNumberSetPreset(mode, setId, presetId)')
  })
})
