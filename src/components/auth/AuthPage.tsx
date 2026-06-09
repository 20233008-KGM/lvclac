import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { useLanguage } from '../../i18n'

interface AuthPageProps {
  variant?: 'page' | 'modal'
}

export function AuthPage({ variant = 'page' }: AuthPageProps) {
  const { t } = useLanguage()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const isModal = variant === 'modal'

  return (
    <div className={isModal ? undefined : 'auth-page'}>
      <div className="auth-card">
        <h1 id={isModal ? 'auth-modal-title' : undefined}>
          {isModal ? t.auth.modalTitle : t.auth.title}
        </h1>
        {isModal && <p className="auth-subtitle">{t.auth.subtitle}</p>}
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
    </div>
  )
}
