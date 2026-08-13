/**
 * 온/오프 토글 스위치(track 40×24 + 흰 knob). 채워진 버튼과 달리 "상태"임을 드러낸다.
 * 마이페이지 환경설정의 자동 저장 2종이 공유한다(2026-07-13 마이페이지 v3 핸드오프).
 */
export function ToggleSwitch({
  checked,
  disabled = false,
  ariaDisabled = false,
  label,
  labelHidden = false,
  onBlocked,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  /** 동작 조건이 충족되지 않았지만, 클릭·키보드 입력으로 이유를 안내해야 하는 상태. */
  ariaDisabled?: boolean
  /** 스위치 왼쪽에 붙는 짧은 상태 라벨(예: "사용"). */
  label: string
  /**
   * true면 라벨을 화면에서 감추고 스크린리더에만 남긴다.
   * on/off가 시각적으로 자명한 토글에서 텍스트 중복을 없애되 접근성은 유지한다.
   */
  labelHidden?: boolean
  onBlocked?: () => void
  onChange: (checked: boolean) => void
}) {
  return (
    <label
      className={`toggle-switch${ariaDisabled ? ' toggle-switch--aria-disabled' : ''}`}
    >
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-disabled={ariaDisabled || undefined}
        onClick={(event) => {
          if (!ariaDisabled) return
          event.preventDefault()
          onBlocked?.()
        }}
        onChange={(event) => {
          if (ariaDisabled) return
          onChange(event.currentTarget.checked)
        }}
      />
      <span
        className={`toggle-switch__label${labelHidden ? ' toggle-switch__label--hidden' : ''}`}
      >
        {label}
      </span>
      <span className="toggle-switch__track" aria-hidden="true">
        <span className="toggle-switch__knob" />
      </span>
    </label>
  )
}
