# Account Setting Guard — "Don't show again" + MyPage Toggle

## Context

`InputPanel.tsx` locks baseline account fields (계좌평가금·계약수·증거금 등) once
`isAccountSetupComplete()` is true. Touching a locked field opens
`AccountSettingChangeModal`, a confirm/cancel dialog; confirming sets
`settingsUnlocked = true` for the rest of that mount only. Two additions are
requested:

1. A "다시 띄우지 않기" checkbox inside that modal.
2. A MyPage on/off toggle controlling the same setting.

This doc covers where that flag lives, why, and the concrete file-by-file plan.

## Investigation Findings

1. **The guard is 100% calculator-state-driven, independent of auth.**
   `isAccountSetupComplete(inputs: CalculatorInputs)` (`accountSettingGuard.ts`)
   takes only calculator inputs — no `user`, no Supabase call. The modal fires
   for signed-out visitors exactly the same as signed-in ones.

2. **`settingsUnlocked` is not persisted anywhere today** — it's a plain
   `useState(false)` in `InputPanel` (`InputPanel.tsx:605`), reset on every
   remount/reload. That's *why* a "don't show again" checkbox is needed at
   all: without persistence, the modal already re-appears every session even
   for a user who confirms it repeatedly.

3. **`SaveDraftToggle.tsx` already solves this exact shape** — a modal with a
   "don't show again" checkbox, backed by `localStorage`, with a
   `try/catch`-wrapped read/write pair (`readSkipEnableModal` /
   `setSkipEnableModal`, lines 18-34) and a "다시 보기" link to re-arm it once
   skipped (`showGuideAgain`, line 266). The account-setting-guard checkbox is
   the same pattern minus the per-mode variant (SaveDraftToggle's flag is
   keyed by `local`/`cloud`; this flag has only one state to skip).

4. **`autoSaveOrderHistory` (from the account-records redesign, same branch)
   is the wrong precedent to copy here**, despite being the newest example of
   a MyPage toggle. It's account-tier (`profiles.auto_save_order_history`)
   because it gates a data-persistence pipeline — rows a signed-in user would
   reasonably expect to follow them across devices. The guard-skip flag gates
   a UI nag, not data; it has no signed-out fallback story (Finding 1 means a
   Supabase-backed flag would leave anonymous users unable to ever silence
   the modal via checkbox, since there's no account to write to).

5. **MyPage is entirely gated behind login** (`MyPageView`, the `!user`
   branch shows a login prompt), but the new toggle itself doesn't need
   `user` data — it just needs to render somewhere inside the authenticated
   branch. It reads/writes the same `localStorage` key the modal checkbox
   uses, so no new state channel or sync logic is needed between the two
   surfaces; each reads current value on its own mount.

6. **No existing MyPage section fits topically.** Sections are profile,
   linked logins, storage, records, billing, privacy — none is "device UI
   preferences." A new minimal section is cleaner than shoehorning this into
   `my-page-storage` (which is about draft/number-set storage, a different
   concept from a modal-dismiss flag) or `my-page-privacy`.

7. **`.my-page-toggle` (used today by the `autoSaveOrderHistoryLabel`
   checkbox row) has no CSS rule anywhere in `App.css`** — confirmed via
   `git diff` against the working tree; it renders unstyled today. Not
   something to silently fix as a drive-by, but flagged under Open Questions
   since this feature adds a *second* consumer of the same undefined class.

8. **`.account-setting-guard-actions`, `.draft-save-modal-footer`,
   `.draft-save-skip` already exist in `App.css`** (lines 2471, 2481, 2489)
   and are generic enough to reuse verbatim for the new checkbox footer — no
   new CSS needed for the modal itself.

## Decision

**localStorage, following the `SaveDraftToggle` pattern exactly — not a
Supabase profile column.**

Rationale: the trigger fires without login (Finding 1), so any account-tier
storage needs a localStorage fallback for anonymous users anyway — at which
point you've built the localStorage path *and* a sync/merge story between it
and the cloud copy, for a flag whose only job is suppressing a dialog. That's
strictly more moving parts for a lower-stakes setting than the data-shaped
`autoSaveOrderHistory` toggle. Single source of truth (localStorage), read by
both the modal checkbox and the MyPage toggle, keeps the two control surfaces
trivially consistent with zero sync code — the tradeoff is no cross-device
sync, which is acceptable for a device-local UI preference (comparable to
"don't show this dialog again" in any desktop app).

## Component Changes

### `src/components/accountSettingGuard.ts` — modified

Add the read/write pair here (not inline in `InputPanel.tsx`) because two
separate component files (`InputPanel.tsx`, `MyPage.tsx`) need to read/write
the same key — this file is already the shared module both would import.

```ts
const SKIP_GUARD_KEY = 'leverage_account_setting_guard_skip'

export function readSkipAccountSettingGuard(): boolean {
  try {
    return localStorage.getItem(SKIP_GUARD_KEY) === '1'
  } catch {
    return false
  }
}

export function setSkipAccountSettingGuard(skip: boolean): void {
  try {
    if (skip) localStorage.setItem(SKIP_GUARD_KEY, '1')
    else localStorage.removeItem(SKIP_GUARD_KEY)
  } catch {
    // ignore
  }
}
```

### `src/components/InputPanel.tsx` — modified

- `AccountSettingChangeModal`: add `dontShowAgain: boolean` /
  `onDontShowAgainChange: (v: boolean) => void` props; render the checkbox in
  a footer block reusing `.draft-save-modal-footer` + `.draft-save-skip`
  (same markup shape as `SaveDraftToggle`'s enable-modal footer,
  `SaveDraftToggle.tsx:433-442`), inside the existing
  `.account-setting-guard-actions` row or just below it.
- `InputPanel`: add `const [dontShowAgain, setDontShowAgain] = useState(false)`.
- `requestUnlock()`: check the flag *before* opening the modal —
  ```ts
  function requestUnlock() {
    if (readSkipAccountSettingGuard()) {
      confirmUnlock()
      return
    }
    setDontShowAgain(false)
    setUnlockModalOpen(true)
  }
  ```
  This mirrors `SaveDraftToggle`'s gate (`if (saveEnabled &&
  !readSkipEnableModal(mode))` before `openEnableModal`, line 207) — skip
  means the guard still *unlocks*, it just stops asking.
- `confirmUnlock()`: persist when checked —
  ```ts
  function confirmUnlock() {
    if (dontShowAgain) setSkipAccountSettingGuard(true)
    setSettingsUnlocked(true)
    setUnlockModalOpen(false)
  }
  ```
- `cancelUnlock()`: unchanged besides resetting `dontShowAgain` to `false`.

No "다시 보기" re-arm link is added to `InputPanel` itself (unlike
`SaveDraftToggle`) — re-arming is the MyPage toggle's job (see below), which
keeps the calculator screen from growing a second small-print control for a
one-time-per-device decision. Flagged under Open Questions in case a re-arm
affordance is also wanted at the point of skip.

### `src/components/MyPage.tsx` — modified

New minimal section, placed after `my-page-storage` (both are device/browser
level, unlike the account-tier sections around them):

```tsx
<section
  id="my-page-preferences"
  className="my-page-panel"
  aria-labelledby="my-page-preferences-title"
>
  <h2 id="my-page-preferences-title">{copy.preferencesTitle}</h2>
  <label className="my-page-toggle">
    <input
      type="checkbox"
      checked={showAccountSettingGuard}
      onChange={(e) => {
        const checked = e.currentTarget.checked
        setShowAccountSettingGuard(checked)
        setSkipAccountSettingGuard(!checked)
      }}
    />
    <span>{copy.accountSettingGuardToggleLabel}</span>
  </label>
  <p className="my-page-field-help">{copy.accountSettingGuardToggleHint}</p>
</section>
```

State lives in the `MyPage()` container (not `MyPageView`, matching the
existing pattern of local `useState` + prop injection for records/billing),
initialized lazily from storage:

```ts
const [showAccountSettingGuard, setShowAccountSettingGuard] = useState(
  () => !readSkipAccountSettingGuard(),
)
```

No `user` dependency, no Supabase call, no busy/error state — a synchronous
localStorage read/write, unlike every other MyPage toggle. Passed to
`MyPageView` as a new `preferencesPanel: ReactNode` prop, same shape as
`recordsPanel`/`billingPanel`, rendered unconditionally (MyPageView only
reaches that render path once already signed in, so no extra `user &&` guard
needed at the call site).

## Data Flow Summary

**Modal checkbox → skip:**
`AccountSettingChangeModal` checkbox → `InputPanel`'s `dontShowAgain` state →
`confirmUnlock()` → `setSkipAccountSettingGuard(true)` → next `requestUnlock()`
call (this session or a future one) short-circuits straight to
`confirmUnlock()`, modal never renders.

**MyPage toggle → skip:**
Checkbox → `setSkipAccountSettingGuard(!checked)` (inverted: toggle ON means
*show* the modal, i.e. skip = false) → next calculator visit's
`requestUnlock()` reads the updated flag.

Both surfaces read `localStorage` directly on their own mount/call; no shared
React state, no event bus — acceptable because the two surfaces are never
mounted at the same time (MyPage and the calculator's `InputPanel` are
different routes) and the flag is a simple boolean, not a rapidly-changing
value.

## i18n Changes

**`src/i18n/types.ts` / `en.ts` / `ko.ts` — `accountSettingGuard`, add:**

```ts
accountSettingGuard: {
  title: string
  body: string
  confirm: string
  cancel: string
  skipModalLabel: string   // new — checkbox label in the modal footer
}
```
- ko: `skipModalLabel: '다시 띄우지 않기'`
- en: `skipModalLabel: "Don't show this again"`

**`myPage` block — add:**
- `preferencesTitle` — ko `'환경설정'` / en `'Preferences'`
- `accountSettingGuardToggleLabel` — ko `'계좌 세팅 변경 시 경고모달 띄우기'` /
  en `'Show warning when changing account setup'`
- `accountSettingGuardToggleHint` — one line explaining scope, e.g. ko
  `'이 기기에서만 적용됩니다. 계정에는 저장되지 않습니다.'` / en `'Applies to
  this device only — not synced to your account.'` (important given Decision
  above: this must not read as an account-wide setting, unlike the
  auto-save-order-history toggle directly above/below it on the same page).

## CSS Changes

None required for the modal (reuses `.account-setting-guard-actions`,
`.draft-save-modal-footer`, `.draft-save-skip`, all pre-existing).
`my-page-preferences` reuses `.my-page-panel` / `.my-page-field-help`
(pre-existing) and `.my-page-toggle` (see Open Questions — currently
undefined).

## Files Touched — Summary

| File | Change |
|---|---|
| `src/components/accountSettingGuard.ts` | modified — add `readSkipAccountSettingGuard` / `setSkipAccountSettingGuard` |
| `src/components/InputPanel.tsx` | modified — checkbox in `AccountSettingChangeModal`, skip-gate in `requestUnlock`, persist in `confirmUnlock` |
| `src/components/MyPage.tsx` | modified — new `my-page-preferences` section + `preferencesPanel` prop |
| `src/i18n/types.ts`, `locales/en.ts`, `locales/ko.ts` | modified — keys listed above |

No changes to `src/db/*`, `AuthContext.tsx`, or any Supabase migration.

## Testing

Following this repo's source-text-inspection convention for portal-based
modals and copy (`accountSettingGuardCopy.test.ts`,
`saveDraftSlotUi.test.ts`) rather than jsdom rendering:

- `src/i18n/accountSettingGuardCopy.test.ts` — extend with
  `skipModalLabel` assertions for ko/en.
- New `src/components/accountSettingGuard.test.ts` cases (this file already
  exists for `isAccountSetupComplete`) — add unit tests for
  `readSkipAccountSettingGuard`/`setSkipAccountSettingGuard` against a mocked
  `localStorage` (or real `localStorage` under jsdom/vitest's default DOM
  env — check how `SaveDraftToggle`'s equivalent functions are tested, if at
  all, before deciding whether a mock is needed).
- New source-text test (e.g. `src/components/accountSettingGuardModalLayout.test.ts`)
  mirroring `saveDraftSlotUi.test.ts`'s style — asserts `InputPanel.tsx`
  contains `readSkipAccountSettingGuard()` inside `requestUnlock`,
  `setSkipAccountSettingGuard(true)` inside `confirmUnlock`, and the checkbox
  markup/class names.
- Extend `src/i18n/myPageCopy.test.ts` (or equivalent) for the three new
  `myPage.*` keys.
- Manual: check the modal checkbox → reload → confirm modal no longer
  appears on next field edit → toggle back on via MyPage → confirm modal
  reappears; verify signed-out users can still check the box and have it
  persist (since this never touches Supabase).

## Open Questions (flag to user before/while Engineer builds)

1. **`.my-page-toggle` has no CSS rule in `App.css` today** (Finding 7) — this
   feature adds a second checkbox depending on that class. Recommend adding
   the rule as part of this work (small, ~10 lines) rather than shipping two
   unstyled checkboxes; flagging since it's technically pre-existing scope
   from the account-records branch, not net-new to this request.
2. **No "다시 보기" re-arm link on the calculator screen itself** — once
   skipped via the modal checkbox, the only way back is the MyPage toggle.
   `SaveDraftToggle` gives an in-place link (`showGuideAgain`) for its own
   skip flag; decide if the same is wanted here, or if routing users to
   MyPage is acceptable (recommended: acceptable, since re-enabling a warning
   is a low-frequency action and MyPage is one click away via the nav).
3. **Section placement/copy for `preferencesTitle`** — proposed as a new
   standalone "환경설정" section after `my-page-storage`. If a future toggle
   of this shape is anticipated soon, this section becomes its natural home;
   if not, it's a one-item section today. Alternative: fold it into
   `my-page-storage` instead of a new section — smaller diff, but mixes two
   different concepts (storage-mode explanation vs. a modal-dismiss flag)
   under one heading.
