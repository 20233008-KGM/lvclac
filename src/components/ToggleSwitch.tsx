/**
 * 온/오프 토글 스위치(track 40×24 + 흰 knob). 채워진 버튼과 달리 "상태"임을 드러낸다.
 * 마이페이지 환경설정의 자동 저장 2종이 공유한다(2026-07-13 마이페이지 v3 핸드오프).
 */
export function ToggleSwitch({
  checked,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  /** 스위치 왼쪽에 붙는 짧은 상태 라벨(예: "사용"). */
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="toggle-switch">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span className="toggle-switch__label">{label}</span>
      <span className="toggle-switch__track" aria-hidden="true">
        <span className="toggle-switch__knob" />
      </span>
    </label>
  )
}
