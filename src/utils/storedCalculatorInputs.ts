import { defaultInputs, type CalculatorInputs } from '../types'
import { normalizeStoredRate } from './inputFormat'
import { sanitizeDraftInputs } from './sanitizeDraftInputs'

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
