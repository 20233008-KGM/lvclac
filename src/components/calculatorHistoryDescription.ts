import type { CalculatorHistoryMove } from '../context/calculatorHistory'
import type { Messages } from '../i18n/types'
import type { CalculatorInputs, MarginInputMode, TotalMarginKind } from '../types'
import { formatNumber } from '../utils/format'
import { formatRateForInput } from '../utils/inputFormat'

export interface VisibleHistoryDiff {
  key: string
  label: string
  before: string
  after: string
}

export type CalculatorHistoryDescription =
  | { kind: 'order'; summary: string; fullDescription: string }
  | { kind: 'fields'; diffs: VisibleHistoryDiff[]; fullDescription: string }

function replaceHistoryTokens(
  template: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  )
}

function formatNumericValue(value: number | undefined): string {
  return value == null ? '-' : formatNumber(value)
}

function formatRateValue(value: number | undefined): string {
  return value == null ? '-' : formatRateForInput(value)
}

function formatMarginMode(value: MarginInputMode | undefined, messages: Messages): string {
  if (value === 'perContract') return messages.marginMode.perContract
  if (value === 'total') return messages.marginMode.total
  return messages.marginMode.rate
}

function formatTotalMarginKind(value: TotalMarginKind | undefined, messages: Messages): string {
  if (value === 'fixed') return messages.marginKindAsk.fixed
  if (value === 'proportional') return messages.marginKindAsk.proportional
  return '-'
}

function visibleHistoryDiffs(
  before: CalculatorInputs,
  after: CalculatorInputs,
  messages: Messages,
): VisibleHistoryDiff[] {
  const entries: VisibleHistoryDiff[] = [
    { key: 'mode', label: messages.modeLabel, before: messages.modes[before.mode], after: messages.modes[after.mode] },
    { key: 'positionSide', label: messages.position, before: before.positionSide === 'long' ? messages.long : messages.short, after: after.positionSide === 'long' ? messages.long : messages.short },
    { key: 'marginInputMode', label: messages.marginMode.label, before: formatMarginMode(before.marginInputMode, messages), after: formatMarginMode(after.marginInputMode, messages) },
    { key: 'totalMarginKind', label: messages.marginKindAsk.question, before: formatTotalMarginKind(before.totalMarginKind, messages), after: formatTotalMarginKind(after.totalMarginKind, messages) },
    { key: 'accountEval', label: messages.fields.accountEquity.label, before: formatNumericValue(before.accountEval), after: formatNumericValue(after.accountEval) },
    { key: 'maintenanceMarginRate', label: messages.fields.maintenanceMarginRate.label, before: formatRateValue(before.maintenanceMarginRate), after: formatRateValue(after.maintenanceMarginRate) },
    { key: 'maintenanceMargin', label: messages.fields.maintenanceMargin.label, before: formatNumericValue(before.maintenanceMargin), after: formatNumericValue(after.maintenanceMargin) },
    { key: 'maintenanceMarginPerContract', label: messages.fields.maintenanceMarginPerContract.label, before: formatNumericValue(before.maintenanceMarginPerContract), after: formatNumericValue(after.maintenanceMarginPerContract) },
    { key: 'entrustedMarginRate', label: messages.fields.entrustedMarginRate.label, before: formatRateValue(before.entrustedMarginRate), after: formatRateValue(after.entrustedMarginRate) },
    { key: 'entrustedMargin', label: messages.fields.entrustedMargin.label, before: formatNumericValue(before.entrustedMargin), after: formatNumericValue(after.entrustedMargin) },
    { key: 'entrustedMarginPerContract', label: messages.fields.entrustedMarginPerContract.label, before: formatNumericValue(before.entrustedMarginPerContract), after: formatNumericValue(after.entrustedMarginPerContract) },
    { key: 'contracts', label: messages.fields.contracts.label, before: formatNumericValue(before.contracts), after: formatNumericValue(after.contracts) },
    { key: 'contractAmount', label: messages.fields.contractAmount.label, before: formatNumericValue(before.contractAmount), after: formatNumericValue(after.contractAmount) },
    { key: 'currentPrice', label: messages.fields.currentPrice.label, before: formatNumericValue(before.currentPrice), after: formatNumericValue(after.currentPrice) },
    { key: 'contractMultiplier', label: messages.fields.contractMultiplier.label, before: formatNumericValue(before.contractMultiplier), after: formatNumericValue(after.contractMultiplier) },
    { key: 'tickSize', label: messages.fields.tickSize.label, before: formatNumericValue(before.tickSize), after: formatNumericValue(after.tickSize) },
    { key: 'orderContracts', label: messages.fields.orderContracts.label, before: formatNumericValue(before.orderContracts), after: formatNumericValue(after.orderContracts) },
    { key: 'orderPrice', label: messages.fields.orderPrice.label, before: formatNumericValue(before.orderPrice), after: formatNumericValue(after.orderPrice) },
    {
      key: 'orderPriceLinked',
      label: messages.calculatorHistory.diff.orderPriceLink,
      before: before.orderPriceLinked
        ? messages.calculatorHistory.diff.linked
        : messages.calculatorHistory.diff.unlinked,
      after: after.orderPriceLinked
        ? messages.calculatorHistory.diff.linked
        : messages.calculatorHistory.diff.unlinked,
    },
  ].filter((entry) => entry.before !== entry.after)

  if (
    entries.some((entry) => entry.key === 'currentPrice')
    && entries.some((entry) => entry.key === 'accountEval')
  ) {
    return entries.filter((entry) => entry.key === 'currentPrice')
  }

  return entries
}

function changedOrderSnapshot(move: CalculatorHistoryMove) {
  const beforeSnapshot = move.before.orderApplyUndoSnapshot
  const afterSnapshot = move.after.orderApplyUndoSnapshot
  if (!afterSnapshot) return null
  if (JSON.stringify(beforeSnapshot) === JSON.stringify(afterSnapshot)) return null
  if (afterSnapshot.orderPrice == null || afterSnapshot.orderContracts == null) return null
  return afterSnapshot
}

export function describeCalculatorHistoryMove(
  move: CalculatorHistoryMove,
  messages: Messages,
): CalculatorHistoryDescription | null {
  const orderSnapshot = changedOrderSnapshot(move)
  if (orderSnapshot) {
    const summary = replaceHistoryTokens(messages.calculatorHistory.orderApplied, {
      price: formatNumericValue(orderSnapshot.orderPrice),
      contracts: formatNumericValue(orderSnapshot.orderContracts),
    })
    return { kind: 'order', summary, fullDescription: summary }
  }

  const diffs = visibleHistoryDiffs(move.before, move.after, messages)
  if (diffs.length > 0) {
    const fullDescription = diffs
      .map((diff) => `${diff.label} ${diff.before} → ${diff.after}`)
      .join(' · ')
    return { kind: 'fields', diffs, fullDescription }
  }

  return null
}
