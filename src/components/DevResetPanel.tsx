import { useState } from 'react'
import { resetTestAccount, type DevResetMode } from '../db/devReset'

/**
 * 개발 전용 "테스트 계정 초기화" 패널.
 * `import.meta.env.DEV`일 때만 MyPage에서 lazy-load 되며, 프로덕션 번들엔 포함되지 않는다.
 */
export function DevResetPanel() {
  const [busy, setBusy] = useState<DevResetMode | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const run = async (mode: DevResetMode) => {
    if (busy) return
    if (
      mode === 'full' &&
      !window.confirm('계정을 완전히 삭제합니다(auth.users 포함, 되돌릴 수 없음). 계속할까요?')
    ) {
      return
    }
    setBusy(mode)
    setMessage(null)
    const error = await resetTestAccount(mode)
    if (error) {
      setBusy(null)
      setMessage(`실패: ${error}`)
      return
    }
    // 성공 → 로그인/데이터 상태 반영 위해 새로고침
    window.location.reload()
  }

  return (
    <section className="my-page-panel" aria-label="개발용 테스트 계정 초기화">
      <div className="my-page-panel-head">
        <h2>🛠 테스트 계정 초기화</h2>
        <span className="my-page-badge my-page-badge--muted">DEV</span>
      </div>
      <p className="my-page-field-help">
        개발 빌드에서만 보입니다. 로컬 <code>.env</code>의 <code>SUPABASE_SERVICE_ROLE_KEY</code>가
        필요합니다.
      </p>
      <div className="my-page-actions">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy !== null}
          onClick={() => void run('data')}
        >
          {busy === 'data' ? '비우는 중…' : '저장 데이터 비우기'}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy !== null}
          onClick={() => void run('full')}
        >
          {busy === 'full' ? '삭제 중…' : '계정 완전 삭제(재가입 테스트)'}
        </button>
      </div>
      {message && (
        <p className="my-page-form-message" role="alert">
          {message}
        </p>
      )}
    </section>
  )
}
