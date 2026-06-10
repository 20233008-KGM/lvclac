/** 계산·검증 레이어에서 반환하는 메시지 코드 (UI에서 번역) */
export type CalcMessageCode =
  | 'contracts_zero'
  | 'multiplier_zero'
  | 'order_contracts_zero'
  | 'maintenance_exceeds_equity'
  | 'maintenance_rate_exceeds_entrusted'
  | 'no_available_margin'
  | 'cannot_calc_per_contract_entrusted'
  | 'order_exceeds_max_buyable'
  | 'order_exceeds_max_sellable'
  | 'order_exceeds_position'
  | 'at_risk'

export function isCalcMessageCode(value: string | null | undefined): value is CalcMessageCode {
  if (!value) return false
  return (
    value === 'contracts_zero' ||
    value === 'multiplier_zero' ||
    value === 'order_contracts_zero' ||
    value === 'maintenance_exceeds_equity' ||
    value === 'maintenance_rate_exceeds_entrusted' ||
    value === 'no_available_margin' ||
    value === 'cannot_calc_per_contract_entrusted' ||
    value === 'order_exceeds_max_buyable' ||
    value === 'order_exceeds_max_sellable' ||
    value === 'order_exceeds_position' ||
    value === 'at_risk'
  )
}
