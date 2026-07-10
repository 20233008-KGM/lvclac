import { assessPasswordStrength, type PasswordStrength } from '../../auth/passwordStrength'
import { useLanguage } from '../../i18n'

const LEVEL_META: Record<
  PasswordStrength,
  { fill: number; className: string; labelKey: string }
> = {
  weak: { fill: 1, className: 'pw-strength--weak', labelKey: 'passwordStrengthWeak' },
  fair: { fill: 2, className: 'pw-strength--fair', labelKey: 'passwordStrengthFair' },
  strong: { fill: 3, className: 'pw-strength--strong', labelKey: 'passwordStrengthStrong' },
}

/**
 * 비밀번호 강도를 3칸 막대 + 라벨로 안내한다. 입력을 막지 않는 안내용이며,
 * 빈 입력에는 아무것도 렌더링하지 않는다.
 */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const { t } = useLanguage()
  const strength = assessPasswordStrength(password)
  if (!strength) return null

  const meta = LEVEL_META[strength]
  return (
    <div className={`pw-strength ${meta.className}`}>
      <div className="pw-strength__track" aria-hidden="true">
        {[1, 2, 3].map((seg) => (
          <span
            key={seg}
            className={`pw-strength__seg${seg <= meta.fill ? ' pw-strength__seg--on' : ''}`}
          />
        ))}
      </div>
      <span className="pw-strength__label" aria-live="polite">
        {t.auth.passwordStrengthLabel}: {t.auth[meta.labelKey]}
      </span>
    </div>
  )
}
