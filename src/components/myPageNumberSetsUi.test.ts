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
const rolloverOff = {
  enabled: false,
  intervalMonths: null,
  anchor: null,
  nextDate: null,
  pending: false,
} as const

function numberSet(
  id: string,
  storageMode: 'local' | 'cloud',
  autoSnapshotEnabled = false,
): CalculatorNumberSet {
  return {
    id,
    title: `${storageMode}-${id}`,
    inputs: defaultInputs,
    updatedAt: null,
    storageMode,
    autoSnapshotEnabled,
    rollover: rolloverOff,
  }
}

function renderPanel(locale: 'ko' | 'en', isPro: boolean, hasEnabledCloudSet = true) {
  const copy = locale === 'ko' ? ko.myPage : en.myPage
  return renderToStaticMarkup(
    createElement(NumberSetPreferencesPanel, {
      copy,
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
      onDeleteNumberSet: noop,
      onSetAutoSnapshot: noop,
      onSetRollover: noop,
      onClearRolloverPending: noop,
    }),
  )
}

describe('my page number-set management UI', () => {
  it('provides a standalone number-set panel with per-location groups', () => {
    const text = source('src/components/MyPage.tsx')
    const css = source('src/styles/pages.css')

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
  })

  it('renders one daily-record column with checked and unchecked cloud rows in both locales', () => {
    const koHtml = renderPanel('ko', true)
    const enHtml = renderPanel('en', true)

    expect(koHtml).toContain(ko.myPage.autoSnapshotSlotHelp)
    expect(koHtml.match(/my-page-number-set-list-head/g)).toHaveLength(1)
    expect(koHtml).toContain('type="checkbox"')
    expect(koHtml).toContain('checked=""')
    expect(koHtml).toContain('my-page-number-set-row--auto-selected')
    expect(koHtml).toContain('cloud-cloud-1: 매일 기록')
    expect(koHtml).toContain('매일 기록 중: 클라우드 세트 1개')
    expect(enHtml).toContain(en.myPage.autoSnapshotSlotHelp)
    expect(enHtml.match(/my-page-number-set-list-head/g)).toHaveLength(1)
    expect(enHtml).toContain('cloud-cloud-1: Record daily')
    expect(enHtml).toContain('Recording daily: 1 cloud set(s)')
  })

  it('keeps daily-record guidance and controls out of local and inactive free sets', () => {
    const html = renderPanel('ko', false, false)

    expect(html).not.toContain(ko.myPage.autoSnapshotSlotHelp)
    expect(html).not.toContain('매일 기록 중')
    expect(html).not.toContain('매일 기록')
    expect(html).not.toContain('my-page-number-set-list-head')
    expect(html).not.toContain('type="checkbox"')
  })

  it('keeps an already-enabled free cloud set removable without enabling inactive rows', () => {
    const html = renderPanel('ko', false, true)

    expect(html.match(/my-page-number-set-list-head/g)).toHaveLength(1)
    expect(html.match(/type="checkbox"/g)).toHaveLength(1)
    expect(html).toContain('checked=""')
    expect(html).toContain('my-page-number-set-row-auto--empty')
  })

  it('uses a fixed checkbox column instead of the former phone-only second row', () => {
    const component = source('src/components/MyPage.tsx')
    const css = source('src/styles/pages.css')

    expect(component).not.toContain('<ToggleSwitch\n              checked={numberSet.autoSnapshotEnabled}')
    expect(component).toContain(
      `onSetAutoSnapshot(
                    numberSet.storageMode,
                    numberSet.id,
                    event.currentTarget.checked,
                  )`,
    )
    expect(component).toContain('</label>\n          ) : (')
    expect(component).toContain('/>\n          )\n        )}\n        <input\n          value={titleDraft}')
    expect(css).toContain('grid-template-columns: 78px minmax(0, 1fr) auto')
    expect(css).not.toContain('@media (max-width: 420px)')
  })
})
