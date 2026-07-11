import { PRESET_IDS, useLanguage, type PresetId } from '../i18n'

interface PresetSelectProps {
  /** 'fixed' = 화면 좌상단 상시 노출(언어 토글 아래), 'inline' = 마이페이지 등 본문 내 */
  variant?: 'fixed' | 'inline'
}

/**
 * 용어 프리셋(거래 종목) 선택기. 언어 토글과 같은 LanguageContext 상태를 공유하므로
 * 어디서 바꾸든 즉시 앱 전역 라벨에 반영된다. 6개 옵션이라 세그먼트 대신 native select.
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
