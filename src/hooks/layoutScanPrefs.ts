/** 페이지(탭) 생명주기 동안만 유지 — 새로고침 시 초기화됨 */
let autoExpandScanShown = false
/** 리사이저 드래그 또는 ⟲ 초기화 — 자동 너비 조절·안내 스캔 억제 */
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

/** ⟲ 초기화도 리사이저 조작과 동일 — 자동 너비 조절 영구 해제(저장 시 manual과 함께 복원) */
export function markLayoutReset(): void {
  resizerManual = true
  suppressAutoExpand = true
}

export function shouldSuppressAutoExpand(): boolean {
  return suppressAutoExpand
}

export function clearAutoExpandSuppress(): void {
  suppressAutoExpand = false
}
