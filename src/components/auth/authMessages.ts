import type { useLanguage } from '../../i18n'

type Translations = ReturnType<typeof useLanguage>['t']

/** AuthContext/validation이 돌려준 코드 문자열을 화면용 메시지로 변환. */
export function authErrorMessage(
  code: string | null,
  t: Translations,
): string | null {
  if (!code) return null
  const map: Record<string, string> = {
    invalid_credentials: t.auth.invalidCredentials,
    email_taken: t.auth.emailTaken,
    email_not_confirmed: t.auth.emailNotConfirmed,
    signup_disabled: t.auth.signupDisabled,
    provider_not_enabled: t.auth.providerNotEnabled,
    rate_limited: t.auth.rateLimited,
    not_configured: t.auth.notConfigured,
    email_required: t.auth.emailRequired,
    email_invalid: t.auth.emailInvalid,
    password_required: t.auth.passwordRequired,
    password_too_short: t.auth.passwordTooShort,
    password_too_long: t.auth.passwordTooLong,
    password_too_common: t.auth.passwordTooCommon,
    password_confirmation_required: t.auth.passwordConfirmationRequired,
    password_mismatch: t.auth.passwordMismatch,
    nickname_too_short: t.auth.nicknameTooShort,
    nickname_too_long: t.auth.nicknameTooLong,
    terms_required: t.auth.termsRequired,
  }
  return map[code] ?? t.auth.genericError
}
