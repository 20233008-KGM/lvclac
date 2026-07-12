import type { CalculatorInputs } from '../types'

/**
 * 총액 모드 주문 시뮬에서 증거금 성격(비례/고정)을 물어봐야 하는 입력 조건.
 * (localStorage의 "다시 안 보기"는 이 함수와 별개로 호출부에서 AND 한다.)
 *
 * 조건: 총액 모드로 증거금을 입력했고, 보유 포지션이 있고(=역산이 의미 있음),
 * 주문 수량이 있고, 아직 성격을 확정하지 않았을 때.
 */
export function isMarginKindAskCandidate(inputs: CalculatorInputs): boolean {
  const isTotalMode =
    inputs.marginInputMode === 'total' &&
    (inputs.maintenanceMargin != null || inputs.entrustedMargin != null)
  const hasOrderQty = inputs.orderContracts != null && inputs.orderContracts !== 0
  const hasHeldPosition = (inputs.contracts ?? 0) > 0
  return (
    isTotalMode && hasOrderQty && hasHeldPosition && inputs.totalMarginKind == null
  )
}

/**
 * 총액 모드 주문 시뮬 시 증거금 성격(비례/고정) 확인 모달을
 * 다시 띄우지 않을지 여부 (localStorage). accountSettingGuard의 skip 패턴과 동일.
 */
const SKIP_MARGIN_KIND_ASK_KEY = 'leverage_margin_kind_ask_skip'

export function readSkipMarginKindAsk(): boolean {
  try {
    return localStorage.getItem(SKIP_MARGIN_KIND_ASK_KEY) === '1'
  } catch {
    return false
  }
}

export function setSkipMarginKindAsk(skip: boolean): void {
  try {
    if (skip) localStorage.setItem(SKIP_MARGIN_KIND_ASK_KEY, '1')
    else localStorage.removeItem(SKIP_MARGIN_KIND_ASK_KEY)
  } catch {
    // ignore
  }
}
