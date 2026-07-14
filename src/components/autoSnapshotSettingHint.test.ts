import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ko } from '../i18n/locales/ko.js'
import { en } from '../i18n/locales/en.js'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

// MyPage 렌더 테스트는 환경설정 섹션을 스텁으로 대체하므로,
// 자동 스냅샷 설정 행의 "값이 바뀐 날만 저장" 안내는 소스 텍스트로 검증한다
// (myPageNumberSetsUi.test.ts와 같은 관례).
describe('auto snapshot setting hint', () => {
  it('renders the change-only hint line next to the auto snapshot setting copy', () => {
    const text = source('src/components/MyPage.tsx')
    const css = source('src/styles/pages.css')

    expect(text).toContain('copy.autoSnapshotBody')
    expect(text).toContain('copy.autoSnapshotChangeOnlyHint')
    expect(text).toContain('my-page-setting-hint')
    expect(css).toContain('.my-page-setting-hint')
  })

  it('has the hint copy in both locales', () => {
    expect(ko.myPage.autoSnapshotChangeOnlyHint).toContain('값이 바뀐 날만')
    expect(en.myPage.autoSnapshotChangeOnlyHint.toLowerCase()).toContain('skipped')
  })
})
