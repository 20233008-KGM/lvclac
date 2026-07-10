# Account Records Redesign (supersedes 2026-07-05-account-records-design.md)

## Context

The 2026-07-05 design shipped order history + account snapshots behind a single
"기록 보기" trigger button and a combined tabbed modal (`AccountRecordsModal` +
`AccountRecordsPanel`), opened from the calculator screen. QA passed on that
implementation (focus trap, focus restore, close-button CSS, unit tests all
fixed), but the shape does not match what the user actually wants:

- The calculator screen should not open a records *browser*. It should have a
  one-click "스냅샷" action that saves immediately and confirms.
- Reviewing/managing saved records (both tabs) belongs on 마이페이지, as real
  list UI — today MyPage only shows two counts (`fetchRecordCounts`, lines
  447-491) with no way to see or manage the rows.
- Order history auto-save needs a kill switch, because right now every order
  "적용" silently writes a row with no way to opt out.
- Both record types need bulk delete, not just per-row delete.

This doc is the file-by-file plan for that redesign. It does not touch billing,
number_sets, or auth flows.

## Investigation Findings (verified against current code + live Supabase project)

1. **`saveOrderRecord` is fully automatic, not button-gated.**
   `ResultPanel.tsx:756-775` defines `saveOrderRecord` and passes it as
   `onApplyOrderScenario` to `OrderInputs` (line 902). `OrderInputs.applyOrderScenario()`
   (`ResultPanel.tsx:369-373`) calls it synchronously every time the user applies
   an order scenario ("적용" / commit-then-apply / Enter flow). There is no
   separate confirmation step to hook a toggle into — the toggle must gate
   inside `saveOrderRecord` itself.

2. **Repository layer (`src/db/accountRecords.ts`) has no bulk delete**, only
   `deleteOrderHistory(userId, id)` / `deleteAccountSnapshot(userId, id)`, each
   doing `.delete().eq('id', id).eq('user_id', userId)`.

3. **RLS already allows bulk delete with no migration.** Both tables' delete
   policies (`supabase/migrations/005_account_records.sql:42-45,57-60`) are
   `using ((select auth.uid()) = user_id)` — row-level, no per-id constraint.
   Verified live via `list_migrations`/`list_tables`: remote is at migration
   `account_records` (005), tables match the file exactly. A plain
   `.delete().eq('user_id', userId)` from the client already satisfies RLS for
   every row owned by that user.

4. **`profiles` table (live, verified via `list_tables`) has only**
   `id, email, nickname, created_at, updated_at`, RLS: select/insert/update by
   owner (`auth.uid() = id`). No existing slot for a preference flag.
   `subscriptions` is a **separate table**, not a profiles column — that
   precedent is for per-provider payment state, not a simple per-user flag, so
   it doesn't generalize here. A single boolean is a much closer fit to
   `nickname`'s shape (one scalar column, same RLS, same update path via
   `saveNickname`/`updateNickname`).

5. **`SaveDraftToggle.tsx`'s tri-state slot UI (off/local/cloud) is the wrong
   model to copy.** It's driven by `CalculatorContext` and answers "where do I
   store draft calculator inputs" (device vs. cloud) with per-mode stored-data
   detection, migration, and delete-confirm sub-modals. The new requirement is
   a single boolean, account-wide, with no per-device concept. Reusing its
   component would import unrelated complexity. What *is* worth reusing is its
   convention: busy-disables-control, inline notice text on error, i18n keys
   named `draftSave.*`.

6. **`DevResetPanel.tsx` already establishes the precedent for a destructive
   bulk action**: `window.confirm(...)` before a full data wipe, no custom
   modal. Bulk-delete confirmation should follow this, not build new modal
   machinery for a two-choice confirm/cancel.

7. **`AuthModal.tsx` is the "light modal shell"** referenced in the request:
   portal to `document.body`, `.disclaimer-overlay` + dialog div, close button,
   Escape + overlay-click to dismiss, body-scroll lock — **no manual Tab-focus
   trap**. `AccountRecordsModal.tsx` (today's work, being deleted) added a
   Tab-trap on top of this same shell as part of today's QA pass. The new
   "저장되었습니다" confirmation modal will follow `AuthModal`'s shell exactly
   (per the request), which is a deliberate downgrade from the trap-hardened
   modal being removed — flagged below under Open Questions, not silently
   dropped.

8. **`AccountRecordsPanel.tsx` renders without a portal** (plain `<section>`),
   and its existing test (`AccountRecordsPanel.test.tsx`) already renders it
   with `renderToStaticMarkup` successfully — unlike the portal-based modal
   tests, this component needs no source-text-only testing workaround. It is
   directly mountable in `MyPage` as-is, with two additive prop changes (below).

9. **Only `AuthButton.tsx` opens `AuthModal`** anywhere in the app; no other
   component prompts login inline. The existing convention for a
   signed-in-only affordance is to hide it when signed out (see
   `cloudAvailable` in `CalculatorContext.tsx:124`, which removes the `cloud`
   slot from `SaveDraftToggle` rather than prompting login). The new "스냅샷"
   button follows the same convention: rendered only when `userId` is present.

10. **CSS**: only `.btn-primary` / `.btn-ghost` exist as `.btn` variants
    (confirmed in `App.css:3957-3990`). `.result-panel__head` currently
    reserves space (`padding-right: 5.5rem`) for exactly one
    absolutely-positioned link (`.result-panel__formulas-btn`,
    `App.css:2717-2756`) — fitting a second button requires restructuring this
    into a flex action group, not just adding a sibling class.

## Decisions

- **Toggle storage**: new `public.profiles.auto_save_order_history boolean not
  null default true` column. Default `true` preserves current behavior (every
  applied order is saved today) so existing users see no surprise change.
  Rejected: a new table (unjustified for one scalar; would duplicate
  `subscriptions`' RLS/repository boilerplate for no benefit) and
  `preferencesRepository.ts` (dead file, explicitly commented `// Launch:
  unused — auth deferred`, wrong shape — it's keyed for calculator inputs, not
  a boolean flag).
- **Bulk delete**: two new repository functions, no migration. RLS already
  permits `DELETE ... WHERE user_id = ?`.
- **Bulk delete confirmation**: `window.confirm` (localized string), matching
  `DevResetPanel`. No new modal component for this.
- **"스냅샷" button**: added to `.result-panel__head`, visible only when
  signed in, calls the existing `saveSnapshot()` logic unchanged, then opens
  the new lightweight confirm modal on success.
- **New confirm modal**: `SnapshotSavedModal.tsx`, cloned from `AuthModal`'s
  shell (overlay, dialog, close button, Escape/overlay-click, scroll lock). No
  Tab-focus trap, matching the named precedent.
- **MyPage**: mounts `AccountRecordsPanel` directly (no modal), owns
  tab/list/loading/error/notice state that `ResultPanel` used to own, adds the
  order-history toggle and both bulk-delete actions.
- **`AccountRecordsModal.tsx` + its test file: deleted outright.** Nothing in
  the new design needs a tab-and-list-bearing modal; the confirm modal is a
  different, much simpler component built fresh from `AuthModal`.
- **`fetchRecordCounts` (MyPage storage summary rows): removed.** Once the full
  panel with real rows is mounted on the same page, the separate
  count-only query and its two `StorageRow`s become a second, capped-at-20-vs-exact
  source of truth for the same information. Flagged under Open Questions in
  case the "at a glance" counts above the fold are wanted regardless.

## Data Model

New migration `supabase/migrations/007_order_history_autosave.sql`:

```sql
-- 주문 기록(order_history) 자동 저장 여부. 기본값 true로 기존 동작(항상 자동 저장)을 보존한다.
alter table public.profiles
  add column if not exists auto_save_order_history boolean not null default true;
```

No RLS changes: the existing "Profiles are updatable by owner" policy
(`auth.uid() = id`, `002_launch_schema.sql:104-108`) already covers writing
this column. No changes to `order_history` / `account_snapshots` RLS: existing
delete policies already permit bulk delete by `user_id`.

## Repository Layer (`src/db/accountRecords.ts`)

Add two functions to `createAccountRecordsRepository()`, next to the existing
single-row deletes:

```ts
async deleteAllOrderHistory(userId: string): Promise<AccountRecordResult<true>> {
  if (!client) return unavailable()
  const { error } = await client.from('order_history').delete().eq('user_id', userId)
  if (error) return { data: null, error: mapError(error) }
  return { data: true, error: null }
},

async deleteAllAccountSnapshots(userId: string): Promise<AccountRecordResult<true>> {
  if (!client) return unavailable()
  const { error } = await client.from('account_snapshots').delete().eq('user_id', userId)
  if (error) return { data: null, error: mapError(error) }
  return { data: true, error: null }
},
```

No other change to this file.

## Profile / Auth Layer

**`src/db/profile.ts`**

- `AuthUser` gains `autoSaveOrderHistory: boolean`.
- `fetchNickname` / `ensureProfile` select `nickname, auto_save_order_history`
  instead of `nickname` alone; `ensureProfile` returns
  `{ nickname: string; autoSaveOrderHistory: boolean }` instead of a bare
  string (its one caller, `buildUser`, updates accordingly).
- Add `saveAutoSaveOrderHistory(userId: string, enabled: boolean): Promise<void>`,
  same shape as `saveNickname`: `.from('profiles').update({ auto_save_order_history: enabled }).eq('id', userId)`.

**`src/context/AuthContext.tsx`**

- `buildUser` reads `autoSaveOrderHistory` off `ensureProfile`'s new return
  shape and includes it on the built `AuthUser`.
- New context method `setAutoSaveOrderHistory(enabled: boolean): Promise<string | null>`,
  mirroring `updateNickname`: guard on `supabase`/`user`, call
  `saveAutoSaveOrderHistory`, optimistically update local `user` state, return
  `null` on success / `'not_configured'` if unavailable.
- Add both to `AuthContextValue` and the provider's value object.

## Component Changes

### `src/components/ResultPanel.tsx` — modified, net simpler

Remove (moves to `MyPage.tsx`, see below):
`recordsTab`, `orderRecords`, `snapshotRecords`, `recordsLoading`,
`recordsError`, `recordsNotice` (banner use — see replacement below),
`recordsModalOpen`, `recordsTriggerRef`, `recordsRequestIdRef`, `loadRecords`,
`deleteOrderRecord`, `deleteSnapshotRecord`, the `useEffect` that calls
`loadRecords` on mount, the `.account-records-trigger-row` button, and the
`<AccountRecordsModal>` mount (import removed).

Keep, adjusted:
- `recordsRepository` (still needed by `saveSnapshot` and `saveOrderRecord`).
- `activeRecordsUserIdRef` (guards stale responses across a user change
  mid-flight — still relevant to both save calls).
- `saveSnapshot`: unchanged logic; on success, instead of
  `setRecordsTab('snapshots')` + notice banner, sets
  `setSnapshotSavedModalOpen(true)`. On error, keeps a local inline error
  message (see CSS/i18n below) instead of the removed notice banner.
- `saveOrderRecord`: add the toggle gate —
  `if (!userId || !user?.autoSaveOrderHistory) return` (was `if (!userId) return`).
  Everything else (payload build, non-blocking failure notice) is unchanged —
  this preserves the spec's existing requirement that a failed auto-save must
  not block the order apply itself.

New:
- `const [snapshotSavedModalOpen, setSnapshotSavedModalOpen] = useState(false)`
- `const [snapshotSaveNotice, setSnapshotSaveNotice] = useState<string | null>(null)` —
  replaces the removed shared `recordsNotice` banner, scoped to just this
  button's error case.
- `snapshotButtonRef` (for focus restore into the button when the confirm
  modal closes).
- In `.result-panel__head`, restructure to a `.result-panel__head-actions`
  wrapper holding both the existing formulas link and the new button:
  ```tsx
  <div className="result-panel__head">
    <h2>{t.result}</h2>
    <div className="result-panel__head-actions">
      <a className="result-panel__head-btn" ...>{t.formulas.title}</a>
      {userId && (
        <button
          type="button"
          ref={snapshotButtonRef}
          className="result-panel__head-btn"
          disabled={snapshotBusy}
          onClick={() => void saveSnapshot()}
        >
          {snapshotBusy ? t.accountRecords.savingSnapshot : t.accountRecords.saveSnapshot}
        </button>
      )}
    </div>
    {snapshotSaveNotice && (
      <p className="account-records-error" role="alert">{snapshotSaveNotice}</p>
    )}
  </div>
  ```
- Lazy-import and mount `SnapshotSavedModal` (new component, below) when
  `snapshotSavedModalOpen`, with `onClose` that also refocuses
  `snapshotButtonRef.current` and a "스냅샷 기록으로 가기" action that
  navigates to `MY_PAGE_PATH` via the existing `navigate` (`useNavigate()`,
  already imported) — reuse the exact pattern used for `FORMULAS_PATH` at
  line 845.

### `src/components/SnapshotSavedModal.tsx` — new file

Cloned from `AuthModal.tsx`'s shell (portal, overlay, `.disclaimer-overlay` +
dialog div, Escape + overlay-click to dismiss, body-scroll lock, close
button using the shared `auth-dialog.css` close-button styles). Props:

```ts
interface SnapshotSavedModalProps {
  onClose: () => void
  onGoToRecords: () => void
  copy: {
    title: string
    body: string
    goToRecords: string
    close: string
  }
}
```

Body: message text + one primary button ("스냅샷 기록으로 가기", calls
`onGoToRecords` which navigates and closes) + the existing corner close
button. No tabs, no data fetching, no delete — intentionally the smallest
possible dialog.

### `src/components/AccountRecordsModal.tsx` — deleted

Superseded entirely by `SnapshotSavedModal` (confirmation) +
`AccountRecordsPanel` mounted directly on `MyPage` (browsing/management). No
remaining caller after `ResultPanel.tsx` is updated.

### `src/components/AccountRecordsModal.test.ts` — deleted

Tests only the deleted modal and the deleted `recordsTriggerRef` focus-restore
behavior in `ResultPanel`. Both are gone; no replacement test needed at this
file, but see Testing section for what replaces the coverage.

### `src/components/AccountRecordsPanel.tsx` — modified, two additive prop changes

1. `onSaveSnapshot` becomes optional (`onSaveSnapshot?: () => void`), and its
   button only renders when provided:
   `{signedIn && activeTab === 'snapshots' && onSaveSnapshot && (...)}`.
   `MyPage` will not pass this prop (snapshot saving now only happens from
   `ResultPanel`), so the button naturally disappears there — no dead click
   target.
2. Add bulk-delete affordances and the orders-tab toggle slot:
   ```ts
   onBulkDeleteOrders?: () => void
   onBulkDeleteSnapshots?: () => void
   orderBulkBusy?: boolean
   snapshotBulkBusy?: boolean
   ordersToolbar?: ReactNode   // rendered above the order list, orders tab only
   ```
   Render a small toolbar row above each list (`.account-record-list-toolbar`):
   `orderBulkBusy`/`snapshotBulkBusy` disable the button and swap its label to
   a "삭제 중…" state; button only renders when the corresponding list is
   non-empty (`orderRecords.length > 0` / `snapshotRecords.length > 0`) and the
   corresponding `onBulkDelete*` prop is provided. `ordersToolbar` renders
   directly under the tab bar when `isOrders` is true, letting `MyPage` inject
   the auto-save toggle without the panel knowing anything about profiles.

No changes to its tab/list/summary/delete rendering otherwise — it is reused,
not rewritten.

### `src/components/MyPage.tsx` — modified

Replace the existing `fetchRecordCounts`-only effect (lines 440-496) with a
single fetch of the full bundle via `recordsRepository.fetchRecentRecords(user.id)`
(same repository, same `DEFAULT_RECORD_LIMIT = 20` cap — pagination beyond
that stays a non-goal, per the original spec). New local state, mirroring what
`ResultPanel` used to own:

```ts
const [recordsTab, setRecordsTab] = useState<AccountRecordsTab>('orders')
const [orderRecords, setOrderRecords] = useState<OrderHistoryRecord[]>([])
const [snapshotRecords, setSnapshotRecords] = useState<AccountSnapshotRecord[]>([])
const [recordsLoading, setRecordsLoading] = useState(false)
const [recordsError, setRecordsError] = useState<string | null>(null)
const [recordsNotice, setRecordsNotice] = useState<string | null>(null)
const [orderBulkBusy, setOrderBulkBusy] = useState(false)
const [snapshotBulkBusy, setSnapshotBulkBusy] = useState(false)
const [autoSaveBusy, setAutoSaveBusy] = useState(false)
```

Handlers moved/added:
- `loadRecords` — same shape as the one removed from `ResultPanel`.
- `deleteOrderRecord` / `deleteSnapshotRecord` — moved verbatim from
  `ResultPanel.tsx:777-809`.
- `bulkDeleteOrders` / `bulkDeleteSnapshots`:
  ```ts
  const bulkDeleteOrders = useCallback(async () => {
    if (!user || orderRecords.length === 0) return
    if (!window.confirm(t.accountRecords.bulkDeleteConfirmOrders)) return
    setOrderBulkBusy(true)
    setRecordsNotice(null)
    const result = await recordsRepository.deleteAllOrderHistory(user.id)
    setOrderBulkBusy(false)
    if (result.error !== null) {
      setRecordsNotice(t.accountRecords.bulkDeleteError)
      return
    }
    setOrderRecords([])
  }, [orderRecords.length, recordsRepository, t.accountRecords, user])
  ```
  (`bulkDeleteSnapshots` mirrors this against `snapshotRecords` /
  `deleteAllAccountSnapshots`.)
- `handleAutoSaveToggle(next: boolean)`: calls `setAutoSaveOrderHistory(next)`
  from `useAuth()`, disables the control via `autoSaveBusy` while in flight,
  shows an error message on failure (mirrors `submitNickname`'s pattern).

Mount, inside `my-page-console` (new section, after the existing
`my-page-storage` section or replacing its two count rows — see Decisions):

```tsx
<AccountRecordsPanel
  copy={t.accountRecords}
  signedIn={Boolean(user)}
  activeTab={recordsTab}
  onTabChange={setRecordsTab}
  loading={recordsLoading}
  error={recordsError}
  notice={recordsNotice}
  orderRecords={orderRecords}
  snapshotRecords={snapshotRecords}
  onRetry={() => void loadRecords()}
  onDeleteOrder={deleteOrderRecord}
  onDeleteSnapshot={deleteSnapshotRecord}
  onBulkDeleteOrders={() => void bulkDeleteOrders()}
  onBulkDeleteSnapshots={() => void bulkDeleteSnapshots()}
  orderBulkBusy={orderBulkBusy}
  snapshotBulkBusy={snapshotBulkBusy}
  ordersToolbar={
    <label className="my-page-toggle">
      <input
        type="checkbox"
        checked={user?.autoSaveOrderHistory ?? true}
        disabled={autoSaveBusy}
        onChange={(e) => void handleAutoSaveToggle(e.currentTarget.checked)}
      />
      <span>{t.myPage.autoSaveOrderHistoryLabel}</span>
    </label>
  }
/>
```

(`onSaveSnapshot` intentionally omitted — see `AccountRecordsPanel` changes
above.)

The existing `my-page-storage` section's `snapshotsTitle` / `orderHistoryTitle`
`StorageRow`s are removed (their data becomes redundant with the panel below);
`cloudInputTitle` row stays, since it covers an unrelated concern
(`number_sets`).

## Data Flow Summary

**Snapshot save (calculator screen):**
`ResultPanel` button click → `saveSnapshot()` (unchanged) →
`recordsRepository.createAccountSnapshot` → on success,
`setSnapshotSavedModalOpen(true)` → `SnapshotSavedModal` renders → "스냅샷
기록으로 가기" → `navigate(MY_PAGE_PATH)` + close.

**Order auto-save (calculator screen):**
`OrderInputs.applyOrderScenario()` → `onApplyOrderScenario` = `saveOrderRecord`
→ gated on `userId && user.autoSaveOrderHistory` → if both true,
`recordsRepository.createOrderHistory` (unchanged payload/error handling).

**Toggle read/write:**
Read: `useAuth().user.autoSaveOrderHistory`, populated at session load /
login via `buildUser` → `ensureProfile` (now selecting the new column).
Write: MyPage toggle → `useAuth().setAutoSaveOrderHistory(next)` →
`saveAutoSaveOrderHistory` (profiles UPDATE, owner-RLS) → optimistic local
`user` state update, consumed immediately by `ResultPanel` on the next order
apply (context value, no refetch needed).

**Bulk delete (MyPage):**
Button click → `window.confirm` → repository `deleteAllOrderHistory` /
`deleteAllAccountSnapshots` (`DELETE ... WHERE user_id = ?`, satisfies existing
RLS) → on success, clear the corresponding local list to `[]`.

## i18n Changes

**`src/i18n/types.ts` / `en.ts` / `ko.ts` — `accountRecords`:**

- Remove: `openButton`, `openAriaLabel` (trigger button gone).
- Reuse unchanged: `saveSnapshot`, `savingSnapshot`, `snapshotSaved` (repurposed
  as modal body text — reads fine as-is: "Account snapshot saved." /
  "저장되었습니다"-equivalent already, confirm final copy during implementation),
  `snapshotSaveError`, `orderSaved`, `orderSaveError`, `deleteError`.
- Add:
  - `savedModalTitle` — modal heading (e.g. "저장 완료" / "Saved")
  - `savedModalGoToRecords` — "스냅샷 기록으로 가기" / "View saved records"
  - `bulkDeleteOrders` — "주문 기록 전체 삭제" / "Delete all order history"
  - `bulkDeleteSnapshots` — "스냅샷 전체 삭제" / "Delete all snapshots"
  - `bulkDeleteBusy` — "삭제 중…" / "Deleting…"
  - `bulkDeleteConfirmOrders` — window.confirm body text for orders
  - `bulkDeleteConfirmSnapshots` — window.confirm body text for snapshots
  - `bulkDeleteError` — generic bulk-delete failure notice

**`myPage` block — add:**
  - `autoSaveOrderHistoryLabel` — "주문 기록 자동 저장" / "Auto-save order history"
  - `autoSaveOrderHistoryHint` — explains what turning it off does (no more
    automatic `order_history` rows on apply; existing rows unaffected)
  - `autoSaveOrderHistoryError` — toggle-save failure notice
  - Remove: nothing required, but `snapshotsTitle` / `orderHistoryTitle` /
    `recordsCount` / `recordsEmpty` become unused once the two `StorageRow`s
    are removed (see Decisions) — confirm before deleting in case the
    at-a-glance counts are wanted back.

## CSS Changes (`src/App.css`)

Remove (only used by deleted modal/trigger):
- `.account-records-modal`
- `.account-records-modal .account-records-panel`
- `.account-records-trigger-row`

Add:
- `.result-panel__head-actions` — flex row, `gap: var(--space-xs)`, replaces
  the single absolutely-positioned anchor; wrapper itself takes the
  `position: absolute; top: 0; right: 0` that `.result-panel__formulas-btn`
  used to hold alone.
- `.result-panel__head-btn` — the pill-button visual style currently defined
  under `.result-panel__formulas-btn` (renamed/generalized so both the
  formulas link and the new snapshot `<button>` share it; a `<button>` needs
  `border: 0; cursor: pointer; font: inherit;` reset added since the existing
  rules were written for an `<a>`).
- `.account-record-list-toolbar` — flex row (`justify-content: flex-end`)
  above each tab's list, holding the bulk-delete button.
- `.my-page-toggle` — simple checkbox+label row for the auto-save control
  (reuses existing `--color-text`/`--space-*` tokens; no new visual system).
- Small addition for `SnapshotSavedModal`'s two-button footer (primary +
  close), reusing `.disclaimer-modal`/`.btn-primary` — likely no new class
  needed beyond a thin wrapper like `.draft-save-modal-footer` already
  provides for `SaveDraftToggle`.

Keep unchanged (still used by `AccountRecordsPanel` on `MyPage`):
`.account-records-panel`, `.account-records-head`, `.account-record-tabs`,
`.account-record-tab`, `.account-records-empty/notice/error`,
`.account-record-list`, `.account-record-item*`, `.account-record-summary*`,
`.account-record-delete`, `.account-record-save` (still applies if a future
save button is ever reintroduced inside the panel; harmless if temporarily
unused).

## Files Touched — Summary

| File | Change |
|---|---|
| `supabase/migrations/007_order_history_autosave.sql` | new — `profiles.auto_save_order_history` |
| `src/db/accountRecords.ts` | modified — add `deleteAllOrderHistory`, `deleteAllAccountSnapshots` |
| `src/db/profile.ts` | modified — `AuthUser.autoSaveOrderHistory`, `ensureProfile` return shape, `saveAutoSaveOrderHistory` |
| `src/context/AuthContext.tsx` | modified — `setAutoSaveOrderHistory`, `buildUser` |
| `src/components/ResultPanel.tsx` | modified — remove modal/trigger/list state, add snapshot button + confirm-modal wiring, gate `saveOrderRecord` |
| `src/components/SnapshotSavedModal.tsx` | new |
| `src/components/AccountRecordsModal.tsx` | **deleted** |
| `src/components/AccountRecordsModal.test.ts` | **deleted** |
| `src/components/AccountRecordsPanel.tsx` | modified — optional `onSaveSnapshot`, bulk-delete props, `ordersToolbar` slot |
| `src/components/MyPage.tsx` | modified — mount panel, own records state, bulk delete, auto-save toggle, remove `fetchRecordCounts` + two `StorageRow`s |
| `src/i18n/types.ts`, `locales/en.ts`, `locales/ko.ts` | modified — keys listed above |
| `src/App.css` | modified — classes listed above |

## Testing

- `src/db/accountRecords.test.ts` — add cases for `deleteAllOrderHistory` /
  `deleteAllAccountSnapshots` (mirroring existing single-delete tests: calls
  `.eq('user_id', ...)` only, returns `unavailable()` when client is null).
- New `src/components/AccountRecordsPanel.test.tsx` cases: bulk-delete button
  hidden when list empty, shown + wired when non-empty, busy state disables
  it; `onSaveSnapshot` omitted → no save button renders; `ordersToolbar`
  renders only on the orders tab.
- New `src/components/SnapshotSavedModal.test.ts` — same source-text-inspection
  convention as the deleted `AccountRecordsModal.test.ts` (portal + jsdom-less
  environment), asserting the `AuthModal`-shell behaviors: Escape/overlay
  close, close-button focus, no Tab-trap code path (so a future
  re-introduction is an intentional diff, not silent drift).
- `src/i18n/accountRecordsCopy.test.ts`, `src/i18n/myPageCopy.test.ts` — extend
  for the new/removed keys.
- Manual: toggle off → apply an order scenario → confirm no new
  `order_history` row; toggle back on → confirm resumes; bulk delete each tab
  with >1 row → confirm all gone and RLS didn't reject the multi-row delete;
  snapshot button hidden while signed out; confirm modal keyboard behavior
  (Escape, overlay click, close button, "가기" navigates to `/my`).

## Open Questions (flag to user before/while Engineer builds)

1. **No Tab-focus trap on `SnapshotSavedModal`** — matches the named
   `AuthModal` precedent, but is a step down from the trap-hardened modal
   being deleted. Confirm this is acceptable, or ask Engineer to add the same
   trap `AccountRecordsModal` had (self-contained, ~15 lines, low risk either
   way).
2. **Removing the two `StorageRow` count lines from `my-page-storage`** — my
   recommendation, to kill a second capped-vs-exact source of truth for the
   same numbers now that the real list sits on the same page. If "at a glance"
   totals above the panel are still wanted, keep `fetchRecordCounts` and just
   leave those two rows in place; everything else in this doc is unaffected.
3. **Bulk-delete confirmation as `window.confirm`** vs. a styled modal —
   recommended for scope/consistency with `DevResetPanel`, but it is a
   plain browser dialog (no custom styling, no i18n control over button
   labels, only the body text). If product wants a branded confirm, that's a
   small additional component, not a blocker to the rest of this design.
