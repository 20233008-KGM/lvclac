import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { useLanguage } from '../../i18n'

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> & {
  label: string
  children?: ReactNode
}

export function PasswordField({ label, children, id, ...inputProps }: PasswordFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [visible, setVisible] = useState(false)
  const { t } = useLanguage()
  const actionLabel = visible ? t.auth.hidePassword : t.auth.showPassword

  return (
    <div className="field">
      <label className="auth-password-label" htmlFor={inputId}>{label}</label>
      <div className="auth-password-input">
        <input {...inputProps} id={inputId} type={visible ? 'text' : 'password'} />
        <button
          type="button"
          className="auth-password-toggle"
          aria-label={actionLabel}
          aria-controls={inputId}
          title={actionLabel}
          disabled={inputProps.disabled}
          onClick={() => setVisible((current) => !current)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="m3 3 18 18" />}
          </svg>
        </button>
      </div>
      {children}
    </div>
  )
}
