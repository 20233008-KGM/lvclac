# Auth Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dated login/signup tab UI with a polished single-card SaaS account flow and verify auth validation, messages, loading, error, success, header, and mobile states.

**Architecture:** Keep auth responsibilities in the existing `src/components/auth` boundary. `AuthPage` owns mode switching and shared shell layout; `LoginForm` and `RegisterForm` own their field state and submit behavior; i18n provides mode-specific copy; CSS in `src/styles/auth-dialog.css` and existing auth header styles in `src/App.css` provide the visual system.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Supabase auth context, existing CSS design tokens.

---

## Scope And File Map

- Modify `src/components/auth/AuthPage.tsx`: remove segmented tabs, render one active card shell, pass mode-specific switch link.
- Modify `src/components/auth/LoginForm.tsx`: use localized submitting text, alert markup, and aria attributes.
- Modify `src/components/auth/RegisterForm.tsx`: same form quality as login plus password confirmation, terms, success notice, and localized submitting text.
- Modify `src/components/auth/GoogleButton.tsx`: align disabled/loading/error presentation with alert styling.
- Modify `src/components/auth/AuthModal.tsx`: replace broken close glyph with stable text/CSS mark and keep dialog title linkage.
- Modify `src/components/auth/AuthButton.tsx`: replace broken loading and caret text, keep account menu accessible.
- Modify `src/components/auth/authMessages.ts`: keep message mapper stable and test-covered.
- Create `src/auth/validation.test.ts`: lock current validation behavior before UI changes.
- Create `src/components/auth/authMessages.test.ts`: lock localized auth error mapping.
- Modify `src/i18n/locales/ko.ts` and `src/i18n/locales/en.ts`: add auth copy keys for the single-card flow.
- Modify `src/styles/auth-dialog.css`: auth modal/card/form/alert/mobile styling.
- Modify `src/App.css`: remove `.auth-tabs`/`.auth-tab` coupling from segmented controls or leave only mode/side controls, and polish header auth controls.
- Verify with `npm run build`, targeted Vitest tests, and browser desktop/mobile checks.

The working tree already contains unrelated user changes. Every implementation step must stage only the files named in that task.

---

### Task 1: Lock Auth Validation And Message Behavior

**Files:**
- Create: `src/auth/validation.test.ts`
- Create: `src/components/auth/authMessages.test.ts`
- Read: `src/auth/validation.ts`
- Read: `src/components/auth/authMessages.ts`
- Read: `src/i18n/locales/ko.ts`
- Read: `src/i18n/locales/en.ts`

- [ ] **Step 1: Write failing auth validation tests**

Create `src/auth/validation.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  validateEmail,
  validateNickname,
  validatePassword,
  validatePasswordConfirmation,
  validateTermsAccepted,
} from './validation'

describe('auth validation', () => {
  it('validates email format and trims surrounding whitespace', () => {
    expect(validateEmail('')).toBe('email_required')
    expect(validateEmail('not-an-email')).toBe('email_invalid')
    expect(validateEmail(' user@example.com ')).toBeNull()
  })

  it('rejects missing, short, long, and common passwords', () => {
    expect(validatePassword('')).toBe('password_required')
    expect(validatePassword('1234567')).toBe('password_too_short')
    expect(validatePassword('a'.repeat(129))).toBe('password_too_long')
    expect(validatePassword('password')).toBe('password_too_common')
    expect(validatePassword('market-safe-42')).toBeNull()
  })

  it('validates password confirmation', () => {
    expect(validatePasswordConfirmation('market-safe-42', '')).toBe(
      'password_confirmation_required',
    )
    expect(validatePasswordConfirmation('market-safe-42', 'different')).toBe(
      'password_mismatch',
    )
    expect(validatePasswordConfirmation('market-safe-42', 'market-safe-42')).toBeNull()
  })

  it('validates nickname length after trimming', () => {
    expect(validateNickname(' a ')).toBe('nickname_too_short')
    expect(validateNickname('a'.repeat(21))).toBe('nickname_too_long')
    expect(validateNickname(' trader ')).toBeNull()
  })

  it('requires terms consent for signup', () => {
    expect(validateTermsAccepted(false)).toBe('terms_required')
    expect(validateTermsAccepted(true)).toBeNull()
  })
})
```

- [ ] **Step 2: Run validation tests and verify they pass or expose current behavior**

Run:

```bash
npx vitest run src/auth/validation.test.ts
```

Expected: tests pass against the current validation module. If a test fails because the current behavior differs, stop and decide whether the spec or the code should change before continuing.

- [ ] **Step 3: Write auth message mapping tests**

Create `src/components/auth/authMessages.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { en } from '../../i18n/locales/en'
import { ko } from '../../i18n/locales/ko'
import { authErrorMessage } from './authMessages'

describe('authErrorMessage', () => {
  it('maps known validation and Supabase auth codes in Korean', () => {
    expect(authErrorMessage('email_required', ko)).toBe(ko.auth.emailRequired)
    expect(authErrorMessage('password_mismatch', ko)).toBe(ko.auth.passwordMismatch)
    expect(authErrorMessage('not_configured', ko)).toBe(ko.auth.notConfigured)
  })

  it('maps known validation and Supabase auth codes in English', () => {
    expect(authErrorMessage('email_required', en)).toBe(en.auth.emailRequired)
    expect(authErrorMessage('password_mismatch', en)).toBe(en.auth.passwordMismatch)
    expect(authErrorMessage('not_configured', en)).toBe(en.auth.notConfigured)
  })

  it('returns null for empty codes and generic copy for unknown codes', () => {
    expect(authErrorMessage(null, en)).toBeNull()
    expect(authErrorMessage('unexpected_server_response', en)).toBe(en.auth.genericError)
  })
})
```

- [ ] **Step 4: Run auth message tests and verify they pass**

Run:

```bash
npx vitest run src/components/auth/authMessages.test.ts
```

Expected: tests pass. These tests protect the copy mapping while the UI markup changes.

- [ ] **Step 5: Commit Task 1**

Stage only the new tests:

```bash
git add src/auth/validation.test.ts src/components/auth/authMessages.test.ts
git -c user.name="Codex" -c user.email="codex@local" commit -m "test: cover auth validation and messages"
```

Expected: commit succeeds. If Git reports unrelated staged files, unstage them before committing.

---

### Task 2: Add Auth Copy Keys For The Single-Card Flow

**Files:**
- Modify: `src/i18n/locales/ko.ts`
- Modify: `src/i18n/locales/en.ts`

- [ ] **Step 1: Update Korean auth copy**

In `src/i18n/locales/ko.ts`, within the `auth` object, keep existing keys and add these keys:

```ts
    loginTitle: '로그인',
    loginSubtitle: '저장된 입력값과 설정을 불러옵니다.',
    registerTitle: '회원가입',
    registerSubtitle: '다른 기기에서도 입력값을 이어서 사용합니다.',
    loginSubmitting: '로그인 중...',
    registerSubmitting: '가입 처리 중...',
    switchToRegisterPrompt: '처음이신가요?',
    switchToRegisterAction: '회원가입',
    switchToLoginPrompt: '이미 계정이 있나요?',
    switchToLoginAction: '로그인',
```

Also keep `modalTitle`, `subtitle`, `tabLogin`, and `tabRegister` for compatibility until the UI no longer uses them. If visible Korean auth strings are mojibake in the file, repair only the auth block strings touched by this task.

- [ ] **Step 2: Update English auth copy**

In `src/i18n/locales/en.ts`, within the `auth` object, keep existing keys and add these keys:

```ts
    loginTitle: 'Log in',
    loginSubtitle: 'Load your saved inputs and settings.',
    registerTitle: 'Sign up',
    registerSubtitle: 'Continue your inputs across devices.',
    loginSubmitting: 'Logging in...',
    registerSubmitting: 'Creating account...',
    switchToRegisterPrompt: 'New here?',
    switchToRegisterAction: 'Sign up',
    switchToLoginPrompt: 'Already have an account?',
    switchToLoginAction: 'Log in',
```

- [ ] **Step 3: Run message mapping tests**

Run:

```bash
npx vitest run src/components/auth/authMessages.test.ts
```

Expected: PASS. Adding keys must not break existing auth message mapping.

- [ ] **Step 4: Commit Task 2**

```bash
git add src/i18n/locales/ko.ts src/i18n/locales/en.ts
git -c user.name="Codex" -c user.email="codex@local" commit -m "feat: add auth flow copy"
```

Expected: commit includes only locale updates.

---

### Task 3: Replace Large Auth Tabs With Bottom Switch Links

**Files:**
- Modify: `src/components/auth/AuthPage.tsx`
- Modify: `src/components/auth/LoginForm.tsx`
- Modify: `src/components/auth/RegisterForm.tsx`

- [ ] **Step 1: Refactor `AuthPage` shell**

Replace the tab layout in `src/components/auth/AuthPage.tsx` with a single-card shell:

```tsx
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
```

- [ ] **Step 2: Update `LoginForm` loading and alert markup**

In `src/components/auth/LoginForm.tsx`, replace the broken submitting label and error markup with:

```tsx
      {error && (
        <p className="auth-alert auth-alert--error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? t.auth.loginSubmitting : t.auth.submitLogin}
      </button>
```

Keep the existing validation sequence and `signInWithPassword` call.

- [ ] **Step 3: Update `RegisterForm` loading, error, and notice markup**

In `src/components/auth/RegisterForm.tsx`, replace the broken submitting label and status markup with:

```tsx
      {error && (
        <p className="auth-alert auth-alert--error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="auth-alert auth-alert--success" role="status">
          {notice}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? t.auth.registerSubmitting : t.auth.submitRegister}
      </button>
```

Keep existing inline password hint logic and terms consent validation.

- [ ] **Step 4: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: build succeeds. If it fails because any auth copy key is missing, add the missing key to both locale files before continuing.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/components/auth/AuthPage.tsx src/components/auth/LoginForm.tsx src/components/auth/RegisterForm.tsx
git -c user.name="Codex" -c user.email="codex@local" commit -m "feat: simplify auth mode switching"
```

Expected: commit includes only the three auth component files unless locale corrections were required in this task.

---

### Task 4: Polish Auth Modal, Form, Alerts, And Mobile Layout

**Files:**
- Modify: `src/styles/auth-dialog.css`
- Modify: `src/App.css`
- Modify: `src/styles/responsive.css` only if desktop/mobile adjustments cannot be kept inside `auth-dialog.css`

- [ ] **Step 1: Remove auth tabs from segmented-control CSS**

In `src/App.css`, remove `.auth-tabs` and `.auth-tab` from the shared segmented-control selectors so deleted auth tabs do not leave unused styling coupled to mode controls:

```css
.mode-toggle,
.side-toggle {
  display: flex;
  gap: var(--space-xs);
  padding: 3px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
}

.mode-btn,
.side-btn {
  flex: 1;
  min-height: calc(var(--touch-min) - 8px);
  padding: var(--space-sm) var(--space-md);
  border: 1px solid transparent;
  border-radius: calc(var(--radius-sm) - 2px);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: var(--font-size-sm);
}
```

Keep the existing hover/active rules for `.mode-btn` and `.side-btn`. Remove `.auth-tab` from those selector lists as well.

- [ ] **Step 2: Replace auth dialog CSS with the polished single-card layout**

Update `src/styles/auth-dialog.css` to include these rules, preserving existing selectors where possible:

```css
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: var(--space-md) 0;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: color-mix(in srgb, var(--color-surface) 94%, #fff 6%);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius);
  padding: var(--space-lg);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.34);
}

.auth-card__header {
  padding-right: var(--space-lg);
}

.auth-card h1 {
  margin: 0 0 var(--space-xs);
  font-size: var(--font-size-xl);
  font-weight: 700;
  text-align: left;
  color: var(--color-text);
}

.auth-subtitle {
  margin: 0 0 var(--space-lg);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  color: var(--color-text-muted);
}

.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  width: 100%;
  min-height: var(--touch-min);
  padding: 0 var(--space-md);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: 650;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.google-btn:hover:not(:disabled),
.google-btn:focus-visible {
  border-color: var(--color-border);
  background: var(--color-surface-2);
  outline: none;
}

.google-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin: var(--space-md) 0;
  color: var(--color-text-dim);
  font-size: var(--font-size-sm);
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border-subtle);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.auth-form .field {
  gap: 6px;
}

.auth-form .field > span {
  font-weight: 650;
  color: var(--color-text-muted);
}

.auth-form .field input {
  min-height: var(--touch-min);
}

.auth-alert {
  margin: 0;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  line-height: 1.45;
}

.auth-alert--error {
  border-color: color-mix(in srgb, var(--color-danger) 36%, transparent);
  background: var(--color-danger-muted);
  color: color-mix(in srgb, var(--color-danger) 82%, #fff 18%);
}

.auth-alert--success {
  border-color: color-mix(in srgb, var(--color-success) 36%, transparent);
  background: color-mix(in srgb, var(--color-success) 12%, transparent);
  color: color-mix(in srgb, var(--color-success) 82%, #fff 18%);
}

.error-msg {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}

.hint {
  font-size: var(--font-size-sm);
  line-height: 1.4;
}

.hint-ok {
  color: var(--color-success);
}

.hint-warn {
  color: var(--color-text-muted);
}

.auth-consent {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: 1.45;
}

.auth-consent input {
  flex: 0 0 auto;
  margin-top: 0.2rem;
}

.auth-legal-links {
  margin-top: calc(var(--space-sm) * -1);
}

.auth-legal-links .legal-links {
  justify-content: flex-start;
  margin: 0;
  font-size: var(--font-size-sm);
}

.auth-switch {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin: var(--space-lg) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: 1.4;
}

.auth-switch__btn {
  min-height: 32px;
  padding: 0 2px;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.auth-switch__btn:hover,
.auth-switch__btn:focus-visible {
  color: #fff;
  outline: none;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.auth-modal {
  position: relative;
  width: min(100%, 440px);
  max-height: min(92vh, 720px);
  overflow-y: auto;
}

.auth-modal-close {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-dim);
  font-size: var(--font-size-lg);
  line-height: 1;
  cursor: pointer;
}

.auth-modal-close:hover,
.auth-modal-close:focus-visible {
  background: var(--color-surface-2);
  color: var(--color-text);
  outline: none;
}

@media (max-width: 480px) {
  .auth-card {
    padding: var(--space-md);
  }

  .auth-modal {
    width: min(100%, calc(100vw - var(--space-md) * 2));
  }
}
```

If existing `.field` rules in `src/App.css` already give inputs the correct border and focus behavior, do not duplicate those rules in `auth-dialog.css`.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit Task 4**

```bash
git add src/styles/auth-dialog.css src/App.css src/styles/responsive.css
git -c user.name="Codex" -c user.email="codex@local" commit -m "style: polish auth modal layout"
```

Expected: commit should not include `src/styles/responsive.css` unless it actually changed.

---

### Task 5: Fix Header Auth Controls And Broken Glyphs

**Files:**
- Modify: `src/components/auth/AuthModal.tsx`
- Modify: `src/components/auth/AuthButton.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: Replace modal close glyph**

In `src/components/auth/AuthModal.tsx`, replace the broken close content:

```tsx
        <button
          type="button"
          className="auth-modal-close"
          onClick={onClose}
          aria-label={t.close}
        >
          <span aria-hidden="true">×</span>
        </button>
```

- [ ] **Step 2: Replace header loading and caret glyphs**

In `src/components/auth/AuthButton.tsx`, replace the loading button content with localized loading text:

```tsx
        <span className="auth-header-btn__loading-text">{t.loading}</span>
```

Replace the broken caret with a CSS-friendly text glyph:

```tsx
          <span className="auth-avatar-btn__caret" aria-hidden="true">
            ▾
          </span>
```

If avoiding Unicode is preferred during implementation, use CSS instead:

```tsx
          <span className="auth-avatar-btn__caret" aria-hidden="true" />
```

and add:

```css
.auth-avatar-btn__caret::before {
  content: '';
  display: block;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid currentColor;
}
```

Use the CSS triangle option if the file otherwise stays ASCII-only.

- [ ] **Step 3: Polish header auth menu styling**

In `src/App.css`, keep the existing account menu structure but make the loading, avatar, and menu states visually consistent:

```css
.auth-header-btn--loading {
  max-width: 7rem;
  opacity: 0.65;
  cursor: default;
}

.auth-header-btn__loading-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auth-avatar-btn__caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  color: var(--color-text-dim);
}
```

Preserve existing avatar/menu dimensions unless browser verification shows clipping.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: build succeeds and no broken auth glyph remains in the changed components.

- [ ] **Step 5: Commit Task 5**

```bash
git add src/components/auth/AuthModal.tsx src/components/auth/AuthButton.tsx src/App.css
git -c user.name="Codex" -c user.email="codex@local" commit -m "fix: clean up auth header states"
```

Expected: commit contains modal close, header loading, and account caret cleanup.

---

### Task 6: Browser Verification And Final Hardening

**Files:**
- Modify only files needed to fix issues found during verification.
- Read: `docs/superpowers/specs/2026-07-05-auth-forms-design.md`

- [ ] **Step 1: Run all targeted auth tests**

Run:

```bash
npx vitest run src/auth/validation.test.ts src/components/auth/authMessages.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS. If unrelated existing tests fail, capture the failing file names and decide whether they are caused by this auth work before changing them.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Start or reuse local dev server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL, usually `http://127.0.0.1:5173/`. If that port is taken, use the next printed port.

- [ ] **Step 5: Desktop browser verification**

At a desktop viewport, verify:

- Header logged-out button opens the modal.
- Modal title says login copy, not a generic tab title.
- No large login/signup segmented tabs are visible.
- Google button is visually secondary.
- Empty login submit shows localized validation copy.
- Invalid email shows localized validation copy.
- Submit button uses `로그인 중...` / `Logging in...` while pending.
- Bottom switch changes to signup.
- Signup form shows nickname, email, password, confirmation, terms, legal links, and signup CTA.
- Password hint appears without shifting the whole card awkwardly.
- Password mismatch hint appears under confirmation.
- Missing terms shows an error alert.
- Email confirmation notice appears as a success alert when sign-up returns the confirmation code.
- Close button is readable and clickable.

- [ ] **Step 6: Mobile browser verification**

At a mobile viewport around 390px wide, verify:

- Modal fits within viewport width.
- Signup form can scroll inside the modal if content exceeds viewport height.
- Labels, long Korean copy, legal links, and alert text do not overflow.
- All primary buttons and the switch link are easy to tap.
- Header account button/menu does not clip long nicknames.

- [ ] **Step 7: Fix verification issues with minimal patches**

For each issue found, make the smallest targeted patch in the relevant file and rerun:

```bash
npx vitest run src/auth/validation.test.ts src/components/auth/authMessages.test.ts
npm run build
```

Expected: targeted tests and build remain green after each fix.

- [ ] **Step 8: Record final status if a durable risk remains**

If any auth risk remains out of scope, record it in `docs/project-memory.md` or the relevant active feature document. The old repo-internal persona memory is retired and should not receive new active task state.

```md
## 2026-07-05 Auth UI

- Completed: single-card login/signup flow with bottom switch links, localized loading/error/success states, and header auth polish.
- Deferred: password reset, magic links, email-first login, Supabase provider configuration.
- Risk: OAuth behavior still depends on Supabase project settings.
```

Skip this step if no durable risk beyond the spec remains.

- [ ] **Step 9: Final commit**

Stage only auth files changed after the previous task commits. Use the explicit path list below and remove any path that did not change:

```bash
git status --short
git add src/auth/validation.test.ts src/components/auth/authMessages.test.ts src/components/auth/AuthPage.tsx src/components/auth/LoginForm.tsx src/components/auth/RegisterForm.tsx src/components/auth/GoogleButton.tsx src/components/auth/AuthModal.tsx src/components/auth/AuthButton.tsx src/components/auth/authMessages.ts src/i18n/locales/ko.ts src/i18n/locales/en.ts src/styles/auth-dialog.css src/App.css src/styles/responsive.css
git -c user.name="Codex" -c user.email="codex@local" commit -m "chore: verify auth form redesign"
```

Expected: commit exists only if verification fixes or active feature-document updates were made. If no files changed after verification, do not create an empty commit.

---

## Final Acceptance Criteria

- Login/signup no longer use large tabs.
- Mode switching uses bottom text links.
- Broken loading, close, and caret glyphs are gone from auth UI.
- Login, signup, Google error, validation error, email confirmation, disabled/loading, header loading, signed-in menu, and sign-out states are accounted for.
- Desktop and mobile browser checks complete without visible overflow, clipping, incoherent overlap, or blocked clicks.
- `npm run build` passes.
- Targeted auth tests pass.
- Any full-suite failures are either fixed or clearly identified as unrelated existing failures.

## Self-Review

- Spec coverage: every approved design requirement maps to Tasks 2-6.
- Placeholder scan: no unfinished marker or unspecified implementation step remains.
- Type consistency: new auth copy keys are accessed through `t.auth.<key>` and the existing `Messages.auth: Record<string, string>` supports those additions.
- Scope check: password reset, magic links, email-first login, provider setup, and billing remain out of scope as specified.
