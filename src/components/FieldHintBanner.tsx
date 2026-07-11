import { useLanguage } from '../i18n'
import type { TraderStage } from './welcomeFlowState'

/**
 * 거래 상태별 "이 칸부터 채우세요" 코치 배너. 계산기 최상단에 노출되며,
 * 실제 강조/흐림은 계산기 <main>의 data-field-hint 속성 + CSS가 처리한다.
 * X를 누르면 영구 닫힘(fieldHint.writeFieldHintDismissed).
 */
export function FieldHintBanner({
  stage,
  onDismiss,
}: {
  stage: TraderStage
  onDismiss: () => void
}) {
  const { t } = useLanguage()
  return (
    <div className="field-hint-banner" role="note">
      <span className="field-hint-banner__icon" aria-hidden="true">
        💡
      </span>
      <p className="field-hint-banner__text">{t.fieldHint[stage]}</p>
      <button
        type="button"
        className="field-hint-banner__close"
        onClick={onDismiss}
        aria-label={t.fieldHint.dismiss}
      >
        ×
      </button>
    </div>
  )
}
