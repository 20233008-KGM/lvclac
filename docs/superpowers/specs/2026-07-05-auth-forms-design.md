# Login and Signup Form Redesign

## Context

The current login and signup forms work at a basic level, but the account experience does not meet the product standard for a SaaS-style financial calculator. The visible problems include a dated login/signup tab split, broken loading and icon characters, weak form hierarchy, thin state feedback, and modal styling that does not fully match the rest of the calculator.

The approved direction is a restrained single-card account flow. The active mode is shown as the page title and primary action. Switching between login and signup happens through a small text link at the bottom of the card, not through large tabs.

## Goals

- Make login and signup feel like one polished account experience, not two bolted-on forms.
- Keep the calculator as the main product experience. The account UI should be calm, compact, and fast to exit.
- Improve functional quality: validation, loading, disabled, success, failure, OAuth, and email confirmation states must be clear.
- Improve visual quality: spacing, hierarchy, field polish, button states, and mobile behavior should feel production-grade.
- Keep Korean and English copy short, direct, and consistent with the existing i18n system.
- Bring the header login button and signed-in account menu into the same visual language.

## Approved Pattern

Use a single auth card with mode-specific content.

Login mode:

- Title: "로그인"
- Subtitle: "저장된 입력값과 설정을 불러옵니다."
- Fields: email, password
- Primary action: "로그인"
- Submitting label: "로그인 중..."
- Bottom switch: "처음이신가요? 회원가입"

Signup mode:

- Title: "회원가입"
- Subtitle: "다른 기기에서도 입력값을 이어서 사용합니다."
- Fields: nickname, email, password, password confirmation, terms consent
- Primary action: "회원가입"
- Submitting label: "가입 처리 중..."
- Bottom switch: "이미 계정이 있나요? 로그인"

The Google button stays above the email/password form in both modes. The divider remains but should be visually quieter than the primary form.

## UI Behavior

- Remove the large `로그인 / 회원가입` segmented tabs.
- Keep mode in `AuthPage` state and pass the active mode to the form area.
- Use one shared auth shell for heading, subtitle, Google button, divider, form body, and switch link.
- Reset form-level error and notice when the user switches modes.
- Keep field values local to each form. Switching modes may clear fields to avoid accidental submission of stale private input.
- Display validation feedback before network submission.
- Display submit errors in a compact alert block above the primary CTA.
- Display signup email confirmation as a success notice block after the form action returns `confirm_email` or `email_taken`.
- Disable submit buttons while submitting.
- Use normal localized text for loading instead of broken placeholder characters.
- Replace broken modal close and account menu caret characters with stable text or CSS-rendered symbols.

## Visual Design

- Card width: keep the existing modal-scale width, with a slightly more generous maximum for signup if needed.
- Radius: use existing tokens, staying at 8px or below.
- Inputs: full-width, stable height, clear focus ring, hover border, placeholder color from existing tokens.
- Buttons: primary CTA is the strongest element; Google is secondary and bordered.
- Alerts: use subtle tinted backgrounds with left border or compact iconless treatment. Error should not visually overpower the entire dialog.
- Legal consent: keep the checkbox and legal links close together, with enough line height for Korean text.
- Header account menu: align avatar, nickname, menu, loading state, and sign-out action with the same button density and border style.

## Accessibility

- Modal keeps `role="dialog"`, `aria-modal="true"`, and a stable `aria-labelledby` target.
- Mode title remains the dialog title target.
- Form errors use `role="alert"` or an equivalent live region.
- Inputs should have explicit labels and connect field-level hints/errors with `aria-describedby` where practical.
- Disabled submit states must still expose readable text.
- Keyboard users can close the modal with Escape and tab through controls in a sensible order.
- Mobile touch targets should be at least the existing `--touch-min` size for primary controls.

## i18n Copy

Add or adjust auth translation keys for:

- login subtitle
- signup subtitle
- submitting login label
- submitting signup label
- login switch prompt
- login switch action
- signup switch prompt
- signup switch action
- optional compact success/error labels if needed

Existing validation messages remain, but copy should be checked for clarity in Korean and English.

## Tests and Verification

Automated coverage should be added for changed auth behavior where the local test stack supports it:

- validation rejects invalid email, missing password, weak password, password mismatch, missing terms, short nickname
- auth error codes still map to localized messages
- submit labels and disabled states render while submitting if component testing is available

Manual/browser verification is required:

- desktop auth modal
- mobile auth modal
- login mode
- signup mode
- mode switching
- Google button error state
- password validation hint
- password mismatch hint
- missing terms error
- email confirmation notice
- Supabase not configured error
- header loading state
- signed-in account menu
- sign-out action

Run at minimum:

- `npm run build`
- relevant Vitest tests for auth validation and auth message mapping
- browser visual check at desktop and mobile viewport widths

## Out of Scope

- Password reset flow
- Magic link or passkey login
- Email existence detection before password entry
- Full legal copy rewrite
- Supabase provider configuration changes
- Pro billing or subscription gates

## Remaining Risks

- The repository already contains broader encoding damage in some comments and localized strings. This work should fix auth-visible broken text, but a full project-wide encoding cleanup is separate.
- Supabase OAuth availability depends on deployment and provider settings outside the UI.
- Account creation and email confirmation behavior can vary by Supabase project settings, so browser verification must include configured and not-configured states where possible.
