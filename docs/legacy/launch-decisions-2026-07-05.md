# Launch decisions - 2026-07-05

## Supabase

- Active project: `lvcalc`
- Project ref: `yszjblzmzipshwtylqxa`
- Project URL: `https://yszjblzmzipshwtylqxa.supabase.co`
- Organization: `personal` (`lglnbbdniqvretscvfry`)
- Previous personal project `pbdbswizxpgllwwvcphk` was deleted after the new project was created.
- Local env file: `.env`
- Schema migrations:
  - `supabase/migrations/002_launch_schema.sql`
  - `supabase/migrations/003_harden_launch_schema.sql`
  - `supabase/migrations/004_revoke_auth_trigger_function.sql`
- Remote database status: `profiles`, `number_sets`, and `subscriptions` exist in `public` with RLS enabled.
- Remote migration status: applied through Supabase MCP.
- Build verification: `npm run build` passed on 2026-07-05.
- Supabase advisor check: performance lints returned no issues. Security lints report only `auth_leaked_password_protection`, which remains unavailable on the current Supabase plan.

## Database scope

- `profiles`: one row per Supabase Auth user, with `nickname` for the account UI.
- `number_sets`: saved calculator input sets owned by a user.
- `subscriptions`: one subscription state row per user/provider, readable by the owner and writable by server-side payment code.

## OAuth redirect URLs to register manually

Add these in Supabase Auth URL settings and in the Google Cloud OAuth client:

- Local development: `http://localhost:5173`
- Supabase callback: `https://yszjblzmzipshwtylqxa.supabase.co/auth/v1/callback`
- Production site: add the final production domain when it is chosen.

Current Supabase Auth config:

- Email/password login: enabled.
- Sign-up: enabled.
- Site URL: `http://localhost:5173`
- Redirect allow list: `http://localhost:5173`, `https://yszjblzmzipshwtylqxa.supabase.co/auth/v1/callback`
- Password minimum length: 8.
- Password composition requirements: none. This follows NIST/OWASP guidance to avoid arbitrary character-class rules.
- Email confirmation: enabled (`mailer_autoconfirm = false`).
- Leaked password protection: not enabled because Supabase reports this as a Pro-plan feature for the current project.
- Google login: app code is wired, but provider credentials must still be added in Supabase after creating a Google OAuth Web client.

## Sign-up implementation baseline

- Require email, nickname, password, password confirmation, and terms/privacy consent.
- Validate password length locally and on Supabase; reject a small set of obviously common passwords client-side.
- Keep email confirmation enabled before first sign-in.
- Use a generic registration notice for duplicate emails so sign-up does not clearly reveal whether an account already exists.
- Create or repair the `profiles` row after login in addition to the database trigger, so Google and email users both have a nickname/profile.
- Keep Google OAuth unavailable until a Google Web OAuth Client ID/Secret is registered in Supabase.

## Week 1 app implementation status

- Email/password auth UI and Supabase session restoration are wired through `AuthContext`.
- Google OAuth app flow is wired through Supabase OAuth redirect, but provider credentials still need to be registered manually.
- Logged-out users can save calculator inputs to `localStorage` when the save toggle is enabled.
- Logged-in users can choose local device storage or cloud storage. Login enables cloud sync but does not force it.
- Logged-in cloud mode can save, load, update, and delete the latest `number_sets` row through Supabase RLS.
- If a local draft exists after login and cloud mode is selected, the save UI shows a migration button to move that device draft into the cloud set.
- Input storage copy, guide text, terms, and privacy copy now distinguish local storage from cloud storage.
- Build verification: `npm run build` passed after the cloud-save implementation.
- Test verification: `npm run test -- src/utils/storedCalculatorInputs.test.ts` and full `npm run test` passed.
- Lint note: focused lint on new save files is blocked only by the existing `react-refresh/only-export-components` pattern in `CalculatorContext`; full `npm run lint` still has pre-existing unrelated errors in other files.

## Payment provider decision

Use PortOne for first launch if settlement is Korea-based. Use Stripe only if the business and payout setup can support an overseas Stripe account. For the current Korea-first launch plan, PortOne is the default choice to carry into the payment implementation week.

## Manual follow-ups

- Register Google OAuth client credentials in Supabase.
- Add the production domain to Supabase redirect URLs after deployment target is final.
- Add payment provider account credentials only as server-side environment variables.
