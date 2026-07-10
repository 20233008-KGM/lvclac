# Password security checklist

Status: launch security checklist
Scope: email/password account authentication for `lvclac`

This document is an engineering checklist, not legal advice. For Korea-first launch,
the minimum password-system bar is:

- Store passwords in an irreversible form.
- Encrypt personal/authentication data in transit.
- Keep access controls, service keys, and access logs under operational control.

References:

- Korean personal information safety standard, Article 7:
  https://www.law.go.kr/LSW//admRulSideInfoP.do?admRulSeq=2100000265956&chrClsCd=010201&dashNo=&docCls=jo&joNo=0007&urlMode=admRulScJoRltInfoR
- Personal Information Protection Act Enforcement Decree, Article 30:
  https://www.law.go.kr/lumLsLinkPop.do?chrClsCd=010202&lspttninfSeq=66999
- Supabase password security:
  https://supabase.com/docs/guides/auth/password-security
- Supabase password auth:
  https://supabase.com/docs/guides/auth/passwords

## Code status

- Production auth path uses `supabase.auth.signUp`, `signInWithPassword`, and
  `updateUser` through `src/context/AuthContext.tsx`.
- Supabase documents that Auth stores password hashes with bcrypt and a random
  salt in `auth.users.encrypted_password`.
- New password validation is intentionally separate from login validation:
  sign-up and set-password enforce the local 8-128 character policy and common
  password blocklist, while login only requires a non-empty password and lets
  Supabase decide whether credentials are valid.
- Legacy prototype files under `src/db/hash.ts`, `src/db/adapters/*`, and
  `src/db/repositories/authRepository.ts` must not be used for production
  account authentication. They do not replace Supabase Auth.

## Required manual checks before production

- [ ] App production domain uses HTTPS.
- [ ] Supabase Auth Site URL is the production HTTPS origin.
- [ ] Supabase Auth Redirect URLs only include required local, Supabase callback,
      and production HTTPS origins.
- [ ] Supabase Auth password minimum length is 8 or higher.
- [ ] Email confirmation remains enabled.
- [ ] Service role keys are server-only and never exposed as `VITE_*`.
- [ ] Supabase rate limits are reviewed for the launch traffic level.
- [ ] Custom SMTP is configured for production auth emails.
- [ ] Password reset UI is implemented before public launch, or explicitly
      listed as a launch blocker.
- [ ] Leaked password protection is enabled if the active Supabase plan supports
      it.

## Current known limits

- Password composition rules are intentionally not required. The local policy
  follows the project decision to prefer length plus common-password blocking
  over arbitrary character-class rules.
- Supabase dashboard settings are operational state and cannot be proven from
  the repository alone. Keep the checked values in the launch notes after each
  production configuration pass.
