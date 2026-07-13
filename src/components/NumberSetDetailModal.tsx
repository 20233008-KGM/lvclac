import { useEffect, useMemo, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useModalFocusRestore } from '../hooks/useModalFocusRestore'
import { useLanguage } from '../i18n'
import { calculateEvaluate } from '../calc/leverage'
import type { CalculatorNumberSet } from '../context/CalculatorContext'
import { formatLeverageValue, formatNumber } from '../utils/format'
import '../styles/auth-dialog.css'

interface NumberSetDetailModalProps {
  numberSet: CalculatorNumberSet
  /** 포커스 복원 대상 ref — 트리거 버튼이 유실될 수 있어 명시적으로 전달받는다. */
  restoreFocusRef?: RefObject<HTMLElement | null>
  onClose: () => void
}

interface DetailRow {
  label: string
  value: string
}

const hasNumber = (value: number | undefined | null): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/**
 * 숫자세트 전체 상세 읽기전용 모달. 세트에 저장된 입력값(빈 값 제외)과 그로부터
 * 계산한 결과(레버리지·청산가)를 정의 목록으로 보여준다. 편집·불러오기 기능은 없다.
 */
export function NumberSetDetailModal({
  numberSet,
  restoreFocusRef,
  onClose,
}: NumberSetDetailModalProps) {
  const { t } = useLanguage()
  const copy = t.myPage
  useModalFocusRestore(restoreFocusRef)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const { inputRows, resultRows } = useMemo(() => {
    const inputs = numberSet.inputs
    const result = calculateEvaluate(inputs)

    const inputRows: DetailRow[] = [
      {
        label: copy.numberSetDetailPositionLabel,
        value: inputs.positionSide === 'short' ? t.short : t.long,
      },
    ]
    const pushNumber = (label: string, value: number | undefined | null) => {
      if (hasNumber(value)) inputRows.push({ label, value: formatNumber(value) })
    }
    // 증거금률은 사용자가 계산기에 입력한 원비율(예: 0.25)을 그대로 보여준다.
    const pushRatio = (label: string, value: number | undefined | null) => {
      if (hasNumber(value)) inputRows.push({ label, value: formatNumber(value, 4) })
    }

    pushNumber(copy.numberSetDetailEquity, inputs.accountEval)
    pushNumber(copy.numberSetDetailPrice, inputs.currentPrice)
    pushNumber(t.fields.contracts.label, inputs.contracts)
    pushNumber(t.fields.contractAmount.label, inputs.contractAmount)
    pushNumber(t.fields.contractMultiplier.label, inputs.contractMultiplier)
    pushRatio(t.fields.maintenanceMarginRate.label, inputs.maintenanceMarginRate)
    pushNumber(t.fields.maintenanceMargin.label, inputs.maintenanceMargin)
    pushNumber(t.fields.maintenanceMarginPerContract.label, inputs.maintenanceMarginPerContract)
    pushRatio(t.fields.entrustedMarginRate.label, inputs.entrustedMarginRate)
    pushNumber(t.fields.entrustedMargin.label, inputs.entrustedMargin)
    pushNumber(t.fields.entrustedMarginPerContract.label, inputs.entrustedMarginPerContract)
    if (hasNumber(inputs.orderContracts) && inputs.orderContracts !== 0) {
      inputRows.push({
        label: t.fields.orderContracts.label,
        value: formatNumber(inputs.orderContracts),
      })
    }
    pushNumber(t.fields.orderPrice.label, inputs.orderPrice)

    const resultRows: DetailRow[] = [
      { label: copy.numberSetDetailLeverage, value: formatLeverageValue(result.leverageRatio) },
      { label: copy.numberSetDetailLiquidation, value: formatNumber(result.liquidationPrice) },
    ]

    return { inputRows, resultRows }
  }, [copy, numberSet, t])

  const modal = (
    <div
      className="disclaimer-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="disclaimer-modal number-set-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="number-set-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="auth-modal-close"
          onClick={onClose}
          aria-label={copy.numberSetDetailClose}
        >
          <span className="auth-modal-close__mark" aria-hidden="true" />
        </button>
        <h2 id="number-set-detail-title" className="disclaimer-modal-title">
          {numberSet.title}
        </h2>

        <section className="number-set-detail-modal__section">
          <h3 className="number-set-detail-modal__heading">
            {copy.numberSetDetailInputsHeading}
          </h3>
          <dl className="number-set-detail-modal__list">
            {inputRows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="number-set-detail-modal__section">
          <h3 className="number-set-detail-modal__heading">
            {copy.numberSetDetailResultsHeading}
          </h3>
          <dl className="number-set-detail-modal__list">
            {resultRows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
