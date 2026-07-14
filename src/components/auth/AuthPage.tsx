import { useState } from 'react'
import { GoogleButton } from './GoogleButton'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { LegalLinks } from '../ServiceDisclaimer'
import { useLanguage } from '../../i18n'

type AuthMode = 'login' | 'register' | 'forgot'

export function AuthPage() {
  const { t } = useLanguage()
  const [mode, setMode] = useState<AuthMode>('login')
  const isLogin = mode === 'login'
  const isForgot = mode === 'forgot'

  const title = isForgot
    ? t.auth.forgotTitle
    : isLogin
      ? t.auth.loginTitle
      : t.auth.registerTitle
  const subtitle = isForgot
    ? t.auth.forgotSubtitle
    : isLogin
      ? t.auth.loginSubtitle
      : t.auth.registerSubtitle

  const eyebrow = isForgot ? t.auth.eyebrowPassword : t.auth.eyebrowAccount

  return (
    <div className="auth-card">
      <div className="auth-card__header">
        <p className="auth-eyebrow">{eyebrow}</p>
        <h1 id="auth-modal-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
      </div>

      {isForgot ? (
        <ForgotPasswordForm onBackToLogin={() => setMode('login')} />
      ) : (
        <>
          <GoogleButton />
          <div className="auth-divider">
            <span>{t.auth.or}</span>
          </div>

          {isLogin ? (
            <LoginForm onForgotPassword={() => setMode('forgot')} />
          ) : (
            <RegisterForm />
          )}

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

          {/* 약관 fine print: 개별 OAuth 버튼 옆이 아니라 모든 로그인 수단 공통으로
              모달 맨 아래에 배치(로그인 모달 업계 표준). */}
          <p className="auth-consent-note">{t.auth.oauthConsent}</p>
          <div className="auth-legal-links">
            <LegalLinks />
          </div>
        </>
      )}
    </div>
  )
}
