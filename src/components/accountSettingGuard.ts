import type { CalculatorInputs } from '../types'

/**
 * 계좌 세팅이 완료되었는지 여부.
 * 완료되면 baseline 필드(계좌평가금·계약수·증거금·포지션 등)가 잠기고,
 * 편집을 시도하면 확인창을 거쳐야 한다. 현재가·틱사이즈는 잠금 대상이 아니며
 * 각각 현재가 입력창(마크 갱신)과 정상 운용 경로로 다룬다.
 */
function hasValue(value: number | undefined): boolean {
  return value != null
}

export function isAccountSetupComplete(inputs: CalculatorInputs): boolean {
  const baseReady =
    hasValue(inputs.accountEval) &&
    hasValue(inputs.contractAmount) &&
    hasValue(inputs.contracts) &&
    hasValue(inputs.contractMultiplier) &&
    hasValue(inputs.currentPrice)

  if (!baseReady) return false

  const mode = inputs.marginInputMode ?? 'rate'
  if (mode === 'rate') {
    return hasValue(inputs.maintenanceMarginRate) && hasValue(inputs.entrustedMarginRate)
  }
  if (mode === 'perContract') {
    return (
      hasValue(inputs.maintenanceMarginPerContract) &&
      hasValue(inputs.entrustedMarginPerContract)
    )
  }
  return hasValue(inputs.maintenanceMargin) && hasValue(inputs.entrustedMargin)
}

const SKIP_GUARD_KEY = 'leverage_account_setting_guard_skip'

export function readSkipAccountSettingGuard(): boolean {
  try {
    return localStorage.getItem(SKIP_GUARD_KEY) === '1'
  } catch {
    return false
  }
}

export function setSkipAccountSettingGuard(skip: boolean): void {
  try {
    if (skip) localStorage.setItem(SKIP_GUARD_KEY, '1')
    else localStorage.removeItem(SKIP_GUARD_KEY)
  } catch {
    // ignore
  }
}
