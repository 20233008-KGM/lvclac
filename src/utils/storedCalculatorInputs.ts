import { defaultInputs, type CalculatorInputs } from '../types.js'
import { normalizeStoredRate } from './inputFormat.js'
import { sanitizeDraftInputs } from './sanitizeDraftInputs.js'

const MEANINGFUL_NUMBER_FIELDS: (keyof CalculatorInputs)[] = [
  'accountEval',
  'maintenanceMarginRate',
  'maintenanceMargin',
  'maintenanceMarginPerContract',
  'entrustedMarginRate',
  'entrustedMargin',
  'entrustedMarginPerContract',
  'contracts',
  'contractAmount',
  'currentPrice',
  'contractMultiplier',
  'orderContracts',
  'orderPrice',
  'mtmPriceAnchor',
  'scenarioPrice',
  'scenarioAppliedPrice',
  'tickSize',
]

export function hasMeaningfulCalculatorInputs(inputs: CalculatorInputs): boolean {
  return MEANINGFUL_NUMBER_FIELDS.some((field) => {
    const value = inputs[field]
    return typeof value === 'number' && Number.isFinite(value)
  })
}

export function normalizeStoredCalculatorInputs(
  prefs: Partial<CalculatorInputs>,
): CalculatorInputs {
  const legacy = prefs as Partial<CalculatorInputs> & {
    additionalContracts?: number
    priceMultiplier?: number
    maintenanceMargin?: number
  }
  const positionSide = prefs.positionSide ?? 'long'
  const marginInputMode =
    prefs.marginInputMode ??
    ((prefs.maintenanceMargin ?? legacy.maintenanceMargin) != null ||
    prefs.entrustedMargin != null
      ? 'total'
      : 'rate')

  return sanitizeDraftInputs({
    ...defaultInputs,
    ...prefs,
    mode: prefs.mode ?? 'evaluate',
    marginInputMode,
    positionSide,
    evalSnapshotSide: prefs.evalSnapshotSide ?? positionSide,
    maintenanceMarginRate: normalizeStoredRate(prefs.maintenanceMarginRate),
    maintenanceMargin: prefs.maintenanceMargin ?? legacy.maintenanceMargin,
    entrustedMarginRate: normalizeStoredRate(prefs.entrustedMarginRate),
    contractMultiplier:
      prefs.contractMultiplier ??
      (typeof legacy.priceMultiplier === 'number' ? legacy.priceMultiplier : undefined),
    orderContracts:
      prefs.orderContracts ??
      (typeof legacy.additionalContracts === 'number'
        ? legacy.additionalContracts
        : undefined),
  })
}

export function parseStoredCalculatorInputs(value: unknown): CalculatorInputs | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return normalizeStoredCalculatorInputs(value as Partial<CalculatorInputs>)
}

/**
 * 저장된 두 입력값이 계산상 같은 값인지 비교한다.
 * 양쪽 다 정규화(normalize)한 뒤 필드 단위로 비교하므로 jsonb 키 순서·레거시
 * 필드명 차이에 흔들리지 않는다. 한쪽이라도 파싱 불가면 "다르다"로 본다.
 */
export function storedCalculatorInputsEqual(a: unknown, b: unknown): boolean {
  const left = parseStoredCalculatorInputs(a)
  const right = parseStoredCalculatorInputs(b)
  if (!left || !right) return false
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  for (const key of keys) {
    if (!Object.is(left[key as keyof CalculatorInputs], right[key as keyof CalculatorInputs])) {
      return false
    }
  }
  return true
}
