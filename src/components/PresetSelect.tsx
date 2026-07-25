import { PRESET_IDS, useLanguage, type PresetId } from '../i18n'

interface PresetSelectProps {
  /** 'fixed' = 화면 좌상단 상시 노출(언어 토글 아래), 'inline' = 마이페이지 등 본문 내 */
  variant?: 'fixed' | 'inline'
}

/**
 * 호환 화면용 단일 용어세트 표시 컨트롤.
 * 공개 계산기 진입점에는 렌더링하지 않으며 값도 바뀌지 않는다.
 */
export function PresetSelect({ variant = 'inline' }: PresetSelectProps) {
  const { preset, setPreset, t } = useLanguage()
  const selectId = 'glossary-preset-select'

  const control = (
    <select
      id={selectId}
      className="preset-select__control"
      value={preset}
      aria-label={t.glossaryPreset.label}
      onChange={(event) => setPreset(event.target.value as PresetId)}
    >
      {PRESET_IDS.map((id) => (
        <option key={id} value={id}>
          {t.glossaryPreset.options[id]}
        </option>
      ))}
    </select>
  )

  if (variant === 'fixed') {
    return <div className="preset-select preset-select--fixed">{control}</div>
  }

  return (
    <div className="preset-select">
      <label className="preset-select__label" htmlFor={selectId}>
        {t.glossaryPreset.label}
      </label>
      {control}
    </div>
  )
}
