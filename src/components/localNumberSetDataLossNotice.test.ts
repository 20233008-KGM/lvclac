import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { en } from '../i18n/locales/en'
import { ko } from '../i18n/locales/ko'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

describe('local number-set data-loss notices', () => {
  it('explains local browser data loss during onboarding in both languages', () => {
    expect(ko.welcome.saveBody).toContain('사이트 데이터·저장 공간')
    expect(ko.welcome.saveBody).toContain('함께 삭제')
    expect(en.welcome.saveBody).toContain('site data or storage')
    expect(en.welcome.saveBody).toContain('also deletes')
  })

  it('keeps the local save modal and slot help consistent', () => {
    expect(ko.draftSave.enableModalBody.join(' ')).toContain('LiqGuard에서 복구할 수 없습니다')
    expect(ko.draftSave.helpHint).toContain('사이트 데이터·저장 공간')
    expect(en.draftSave.enableModalBody.join(' ')).toContain('LiqGuard cannot recover')
    expect(en.draftSave.helpHint).toContain('site data or storage')
  })

  it('shows the compact picker note only for local groups and local empty state', () => {
    const component = source('src/components/SaveDraftToggle.tsx')
    const styles = source('src/App.css')

    expect(component).toContain("{mode === 'local' && (")
    expect(component).toContain("{storageMode === 'local' && (")
    expect(component).toContain('t.draftSave.localDataLossNote')
    expect(component.match(/t\.draftSave\.localDataLossNote/g)).toHaveLength(2)
    expect(styles).toContain('.draft-number-set-menu__storage-note')
    expect(styles).toContain('color: var(--color-text-dim);')
    expect(styles).not.toContain('.draft-number-set-menu__storage-note--warning')
  })

  it('renders the persistent management note as a short panel footnote', () => {
    const component = source('src/components/MyPage.tsx')
    const styles = source('src/styles/pages.css')

    expect(component).not.toContain('storageNote?: string')
    expect(component).not.toContain('storageNote={copy.localStorageNote}')
    expect(component).toContain(
      'className="my-page-field-help my-page-number-set-storage-footnote" role="note"',
    )
    expect(component.match(/\{copy\.localStorageNote\}/g)).toHaveLength(1)
    expect(styles).not.toContain('.my-page-number-set-storage-note')
    expect(ko.myPage.localStorageNote).toBe(
      '이 기기 세트는 이 브라우저에만 저장되며, 브라우저 데이터 삭제 시 함께 사라집니다.',
    )
    expect(en.myPage.localStorageNote).toBe(
      'Device sets stay in this browser only and disappear when its browser data is cleared.',
    )
  })
})
