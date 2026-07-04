import { useState } from 'react'
import { GoogleButton } from './GoogleButton'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { useLanguage } from '../../i18n'

type AuthMode = 'login' | 'register'

export function AuthPage() {
  const { t } = useLanguage()
  const [mode, setMode] = useState<AuthMode>('login')
  const isLogin = mode === 'login'

  return (
    <div className="auth-card">
      <div className="auth-card__header">
        <h1 id="auth-modal-title">
          {isLogin ? t.auth.loginTitle : t.auth.registerTitle}
        </h1>
        <p className="auth-subtitle">
          {isLogin ? t.auth.loginSubtitle : t.auth.registerSubtitle}
        </p>
      </div>

      <GoogleButton />
      <div className="auth-divider">
        <span>{t.auth.or}</span>
      </div>

      {isLogin ? <LoginForm /> : <RegisterForm />}

      <p className="auth-switch">
        <span>
          {isLogin ? t.auth.switchToRegisterPrompt : t.auth.switchToLoginPrompt}
        </span>
        <button
          type="button"
          className="auth-switch__btn"
          onClick={() => setMode(isLogin ? 'register' : 'login')}
        >
          {isLogin ? t.auth.switchToRegisterAction : t.auth.switchToLoginAction}
        </button>
      </p>
    </div>
  )
}
