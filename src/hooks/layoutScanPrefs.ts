/** 페이지(탭) 생명주기 동안만 유지 — 새로고침 시 초기화됨 */
let autoExpandScanShown = false
let resizerManual = false
/** ⟲ 리셋 직후 자동 확장(split·gap) 억제 — 입력 변경 시 해제 */
let suppressAutoExpand = false

export function readAutoWidenScanShown(): boolean {
  return autoExpandScanShown
}

export function markAutoWidenScanShown(): void {
  autoExpandScanShown = true
}

export function readResizerManual(): boolean {
  return resizerManual
}

export function markResizerManual(): void {
  resizerManual = true
}

export function canShowAutoWidenScan(layoutManual: boolean): boolean {
  return !layoutManual && !resizerManual && !autoExpandScanShown
}

export function markLayoutReset(): void {
  suppressAutoExpand = true
}

export function shouldSuppressAutoExpand(): boolean {
  return suppressAutoExpand
}

export function clearAutoExpandSuppress(): void {
  suppressAutoExpand = false
}
