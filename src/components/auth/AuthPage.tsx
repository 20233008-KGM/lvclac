// Launch: unused — auth deferred
import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { useLanguage } from '../../i18n'

export function AuthPage() {
  const { t } = useLanguage()
  const [tab, setTab] = useState<'login' | 'register'>('login')

  return (
    <div className="auth-card">
      <h1 id="auth-modal-title">{t.auth.modalTitle}</h1>
      <p className="auth-subtitle">{t.auth.subtitle}</p>
      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
          onClick={() => setTab('login')}
        >
          {t.auth.tabLogin}
        </button>
        <button
          type="button"
          className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
          onClick={() => setTab('register')}
        >
          {t.auth.tabRegister}
        </button>
      </div>
      {tab === 'login' ? <LoginForm /> : <RegisterForm />}
    </div>
  )
}
