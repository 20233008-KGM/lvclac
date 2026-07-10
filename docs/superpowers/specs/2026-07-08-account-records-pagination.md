# Account Records Pagination ("더 보기")

## Context

`docs/superpowers/specs/2026-07-07-account-records-redesign.md` shipped
(`codex/account-records`, working tree today) moved order-history/snapshot
browsing to `MyPage`, mounting `AccountRecordsPanel` directly with real
list/delete/bulk-delete UI. That redesign kept `fetchRecentRecords(userId,
limit=20)` as a hard cap with no way to see more — verified still true in the
current `src/db/accountRecords.ts:256-291`. `MyPage.tsx`'s `loadRecords`
(current lines 488-520) calls it once on mount and never again. `.account-record-list`
(`src/App.css:2954-2961`) is an unbounded flex column with no `max-height`.
Confirmed no `count`/total is fetched or shown anywhere today —
`fetchRecordCounts` exists in the repository (`accountRecords.ts:293-317`) but
is **currently unused dead code**: it was called by `MyPage`'s old
count-only "저장 데이터" summary rows, which the 07-07 redesign removed once the
real list replaced them.

This doc designs real pagination on top of that shipped state. Design only,
no code.

## Investigation Findings

1. **Scale is small.** This is a personal calculator's per-user record store,
   not a multi-tenant analytics table — realistic per-user volumes are tens to
   low hundreds, not thousands. This directly informs the offset-vs-cursor
   trade-off below.
2. **`fetchRecentRecords` has exactly one caller** (`MyPage.tsx:504`) and one
   test that only exercises its `unavailable()` branch
   (`accountRecords.test.ts:74-81`, checked full file). Its return shape can be
   extended without touching any other call site, and no existing assertion
   locks in its current success-path shape.
3. **`fetchRecordCounts` is dead code today**, not deleted — a clean reuse
   target rather than a new function, directly answering the "is a count
   query needed" question in requests #1 and #4 below: yes, and it already
   exists.
4. **Both indexes are `(user_id, created_at desc)` only** — no `id` in the
   index (`005_account_records.sql:23-24,26-27`). A keyset/cursor design over
   `(created_at, id)` would need a composite `.or()` filter
   (`created_at.lt.X,and(created_at.eq.X,id.lt.Y)`) that this index does not
   fully support (the tiebreaker `id` comparison isn't covered), so cursor
   pagination would want an index change too. Offset pagination needs no
   index change — the existing `(user_id, created_at desc)` index already
   serves `.range()` directly.
5. **No IntersectionObserver anywhere in this codebase** (confirmed by
   search) — every existing "load more/expand" style interaction in this app
   is a plain button (`SaveDraftToggle`'s migrate action, `BulkDeleteConfirmModal`,
   the bulk-delete buttons just added). Infinite scroll would be this
   project's first use of a scroll-observer pattern.
6. **`AccountRecordsPanel` already renders orders/snapshots as fully
   independent state** (`orderRecords`/`snapshotRecords`, separate delete
   handlers, separate bulk-delete busy flags) driven by `MyPage` as a
   controlled component; switching `activeTab` only changes which list
   renders, it does not unmount or refetch either list. Per-tab pagination
   state (offset/hasMore/total) fits this exact shape with zero new
   coordination logic — it's additive state slots, not a new mechanism.
7. **`.account-record-list-toolbar`** (`App.css:3050-3053`) already exists as
   a `flex; justify-content: flex-end` row above each list, currently holding
   only the bulk-delete button. It's the natural home for a "표시 중 N / 총
   M개" indicator (`justify-content: space-between`, count on the left, delete
   button on the right) without adding a new DOM location.
8. **`useModalFocusRestore`** (`src/hooks/useModalFocusRestore.ts`, new since
   the 07-07 redesign) and `BulkDeleteConfirmModal` establish the current
   busy-button convention: swap label to a `*Busy` copy string, `disabled`
   while in flight. "더 보기" should match this, not invent a new pattern.
9. **Checked against the pending UI/UX plan**
   (`C:\Users\rlarb\.claude\plans\ui-ux-pure-diffie.md`, not yet applied —
   verified no `my-page-nav`/`my-page-body`/`--bp-sidebar` usage exists yet in
   `MyPage.tsx`/`App.css`/`pages.css`). That plan touches:
   `.account-record-tabs`/`.account-record-tab` (lines 2885-2917 in its
   snapshot of `App.css`, tab pill restyle), adds `id="my-page-records"` to
   `AccountRecordsPanel`'s root `<section>`, wraps `MyPage`'s `<main
   className="my-page-console">` in a new `.my-page-body` grid, and adds a
   side-nav. **None of this overlaps** what pagination touches: the tab bar's
   own rules stay byte-for-byte compatible (pagination doesn't restyle
   `.account-record-tab*`), the toolbar/list/button changes below live
   entirely inside `AccountRecordsPanel`'s body, below where that plan adds
   its `id` attribute, and `MyPage`'s new state fields are unrelated to that
   plan's `showAccountSettingGuard`/nav state. Both can land in either order
   with no merge conflict expected beyond adjacent lines in the same files.

## Decisions

- **Offset-based (`.range()`) pagination, not cursor/keyset.** At this
  record volume, `.range()`'s O(offset) scan cost is irrelevant (a few
  hundred rows, worst case), it needs no index change, and it's far less code
  than composite-cursor filters. Cursor pagination is the right call once
  per-user volume reaches the thousands+ range or `created_at` collisions
  become likely (bulk-imported data, high-frequency writes) — neither applies
  here. Revisit if that changes.
- **Offset drift from mid-session deletes is fixed by decrementing offset
  locally, not by switching to cursors.** Deleting a fetched row shrinks the
  server-side result set by one; if the tracked offset doesn't move,
  "더 보기" would skip exactly one row. Fix: every successful single-row
  delete decrements that tab's offset (and total) by 1 alongside splicing the
  local list. Bulk delete resets both to 0. New records never enter this
  picture — they're only ever created from `ResultPanel` on the calculator
  screen, a different mount than `MyPage`'s paginated list, so there's no
  "list grew while paginating" case to handle.
- **`hasMore` via N+1 overfetch, not a separate exact check.** Each page
  fetch requests `limit + 1` rows and only displays the first `limit`;
  `hasMore = rows.length > limit`. This needs no count query and never wastes
  a click on an empty trailing page (the alternative — fetch exactly `limit`
  and show the button until a click returns zero rows — would waste exactly
  one click at each table's true end).
- **Exact total count is fetched once per initial load, then maintained
  locally, reusing the already-existing `fetchRecordCounts`.** It answers
  both request #1 (does "더 보기" need a count — no, `hasMore` already covers
  that) and request #4 (does bulk-delete-confirm need a count — yes) with a
  single fetch: `fetchRecordCounts` runs alongside `fetchRecentRecords` in the
  initial `Promise.all`, its two numbers seed `orderTotal`/`snapshotTotal`,
  and every subsequent delete/bulk-delete updates those numbers locally
  (decrement by 1 / reset to 0) — no repeated COUNT queries. This is also
  surfaced as a "표시 중 N / 총 M개" indicator in the panel itself, which is a
  free byproduct of fetching it for the confirm-modal copy, not a separate
  feature.
- **"더 보기" button, not infinite scroll.** No IntersectionObserver
  precedent in this codebase, record counts here are small enough that
  "a few clicks to see everything" is not a real burden, and a button is
  trivially testable with `renderToStaticMarkup` + click, matching every
  other test in this file's family. Revisit only if usage data ever shows
  users routinely loading 5+ pages.
- **Tabs do not reset each other's pagination.** Orders and snapshots get
  fully separate state slots (offset/hasMore/total/loadingMore per tab).
  Switching tabs is a pure display toggle in `AccountRecordsPanel`, already
  true today — nothing needs to change to get "keep what was loaded per tab"
  behavior; it falls out of not sharing state between the two lists.
- **`.account-record-list` gets a `max-height` + internal scroll once it has
  overflowed content**, so repeated "더 보기" clicks grow a bounded scroll
  region instead of pushing the rest of `MyPage` further down every time.
  The toolbar (count + bulk-delete button) stays above this scroll container
  in the existing DOM order, so it's always visible without scrolling to find
  it.
- **Bulk-delete confirm copy shows the exact total when known, falls back to
  the current count-less copy when not.** Since the bulk-delete button is
  already only shown once `orderRecords.length > 0`/`snapshotRecords.length >
  0`, "count unknown" only happens if the supplementary `fetchRecordCounts`
  call itself failed — core delete functionality must not depend on it
  succeeding.

## Repository Layer (`src/db/accountRecords.ts`)

New shared type:

```ts
export interface PaginatedRecords<T> {
  records: T[]
  hasMore: boolean
}
```

New functions on `createAccountRecordsRepository()`:

```ts
async fetchOrderHistoryPage(
  userId: string,
  offset: number,
  limit = DEFAULT_RECORD_LIMIT,
): Promise<AccountRecordResult<PaginatedRecords<OrderHistoryRecord>>> {
  if (!client) return unavailable()
  const { data, error } = await client
    .from('order_history')
    .select('id,position_side,order_contracts,order_price,before_inputs,after_inputs,before_result,after_result,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit)          // limit+1 rows, inclusive range
    .returns<OrderHistoryRow[]>()
  if (error) return { data: null, error: mapError(error) }
  const rows = data ?? []
  return {
    data: {
      records: rows.slice(0, limit).map(rowToOrderHistoryRecord),
      hasMore: rows.length > limit,
    },
    error: null,
  }
},

async fetchAccountSnapshotsPage(
  userId: string,
  offset: number,
  limit = DEFAULT_RECORD_LIMIT,
): Promise<AccountRecordResult<PaginatedRecords<AccountSnapshotRecord>>> {
  // mirrors fetchOrderHistoryPage against account_snapshots
},
```

`fetchRecentRecords` is reimplemented in terms of these two (offset `0`), and
its return type gains the two `hasMore` flags — this is the "first page" of
the same pagination primitive, not a separate code path:

```ts
export interface AccountRecordsBundle {
  orderHistory: OrderHistoryRecord[]
  accountSnapshots: AccountSnapshotRecord[]
  hasMoreOrders: boolean
  hasMoreSnapshots: boolean
}

async fetchRecentRecords(userId, limit = DEFAULT_RECORD_LIMIT) {
  if (!client) return unavailable()
  const [orders, snapshots] = await Promise.all([
    this.fetchOrderHistoryPage(userId, 0, limit),
    this.fetchAccountSnapshotsPage(userId, 0, limit),
  ])
  if (orders.error) return { data: null, error: orders.error }
  if (snapshots.error) return { data: null, error: snapshots.error }
  return {
    data: {
      orderHistory: orders.data.records,
      accountSnapshots: snapshots.data.records,
      hasMoreOrders: orders.data.hasMore,
      hasMoreSnapshots: snapshots.data.hasMore,
    },
    error: null,
  }
},
```

`fetchRecordCounts` — **unchanged**, just gets a new caller (`MyPage`).

No changes to `deleteOrderHistory` / `deleteAccountSnapshot` /
`deleteAllOrderHistory` / `deleteAllAccountSnapshots`.

## `src/components/AccountRecordsPanel.tsx` — additive props only

```ts
interface AccountRecordsPanelProps {
  // ...existing props unchanged...
  orderShownCount?: number      // orderRecords.length, passed explicitly so
  orderTotalCount?: number | null   // the panel doesn't need to know about offsets
  snapshotShownCount?: number
  snapshotTotalCount?: number | null
  onLoadMoreOrders?: () => void
  onLoadMoreSnapshots?: () => void
  orderLoadingMore?: boolean
  snapshotLoadingMore?: boolean
}
```

Rendering changes inside the existing per-tab branches, both places that
currently render `.account-record-list-toolbar`:

```tsx
{(onBulkDeleteOrders || orderTotalCount != null) && (
  <div className="account-record-list-toolbar">
    <span className="account-record-count">
      {orderTotalCount != null
        ? copy.shownCount
            .replace('{shown}', String(orderShownCount ?? orderRecords.length))
            .replace('{total}', String(orderTotalCount))
        : null}
    </span>
    {onBulkDeleteOrders && (
      <button /* unchanged bulk-delete button */ />
    )}
  </div>
)}
<ul className="account-record-list">
  {/* unchanged item mapping */}
</ul>
{onLoadMoreOrders && orderHasMoreOrdersFlagIsImplicitViaButtonPresence /* see below */ && (
  <button
    type="button"
    className="link-btn account-record-load-more"
    disabled={orderLoadingMore}
    onClick={onLoadMoreOrders}
  >
    {orderLoadingMore ? copy.loadingMore : copy.loadMore}
  </button>
)}
```

Simplification: `AccountRecordsPanel` doesn't need its own `hasMore` prop —
`MyPage` only passes `onLoadMoreOrders` (non-undefined) when that tab's
`hasMore` is true, and clears it (passes `undefined`) once exhausted. This
keeps the "should the button render" decision in one place (`MyPage`, which
already owns `hasMore` state) instead of duplicating it as a second prop pair
into the panel.

(Mirror the same block for the snapshots branch.)

## `src/components/MyPage.tsx`

New state, added next to the existing records state
(`recordsTab`/`orderRecords`/etc., current lines 434-443):

```ts
const [orderOffset, setOrderOffset] = useState(0)
const [snapshotOffset, setSnapshotOffset] = useState(0)
const [orderHasMore, setOrderHasMore] = useState(false)
const [snapshotHasMore, setSnapshotHasMore] = useState(false)
const [orderTotal, setOrderTotal] = useState<number | null>(null)
const [snapshotTotal, setSnapshotTotal] = useState<number | null>(null)
const [orderLoadingMore, setOrderLoadingMore] = useState(false)
const [snapshotLoadingMore, setSnapshotLoadingMore] = useState(false)
```

`loadRecords` (current lines 488-520) — extend the single `fetchRecentRecords`
call into a `Promise.all` with `fetchRecordCounts`, and seed the new state:

```ts
const [bundleResult, countsResult] = await Promise.all([
  recordsRepository.fetchRecentRecords(userId),
  recordsRepository.fetchRecordCounts(userId),
])
// existing stale-response guard unchanged
if (bundleResult.error !== null) { /* unchanged error handling */ }

setOrderRecords(bundleResult.data.orderHistory)
setSnapshotRecords(bundleResult.data.accountSnapshots)
setOrderOffset(bundleResult.data.orderHistory.length)
setSnapshotOffset(bundleResult.data.accountSnapshots.length)
setOrderHasMore(bundleResult.data.hasMoreOrders)
setSnapshotHasMore(bundleResult.data.hasMoreSnapshots)
// counts are supplementary — a failure here must not fail the whole load
setOrderTotal(countsResult.error === null ? countsResult.data.orderHistoryCount : null)
setSnapshotTotal(countsResult.error === null ? countsResult.data.accountSnapshotCount : null)
```

New handlers:

```ts
const loadMoreOrders = useCallback(async () => {
  const userId = user?.id ?? null
  if (!userId || orderLoadingMore || !orderHasMore) return
  setOrderLoadingMore(true)
  const result = await recordsRepository.fetchOrderHistoryPage(userId, orderOffset)
  setOrderLoadingMore(false)
  if (activeRecordsUserIdRef.current !== userId) return
  if (result.error !== null) {
    setRecordsNotice(t.accountRecords.loadMoreError)
    return
  }
  setOrderRecords((prev) => [...prev, ...result.data.records])
  setOrderOffset((prev) => prev + result.data.records.length)
  setOrderHasMore(result.data.hasMore)
}, [orderHasMore, orderLoadingMore, orderOffset, recordsRepository, t.accountRecords.loadMoreError, user?.id])
```

(`loadMoreSnapshots` mirrors this against `snapshotRecords`/`snapshotOffset`/
`snapshotHasMore`/`fetchAccountSnapshotsPage`.)

`deleteOrderRecord` / `deleteSnapshotRecord` (current lines 522-556) — add one
line each, right where the local list is spliced:

```ts
setOrderRecords((prev) => prev.filter((record) => record.id !== id))
setOrderOffset((prev) => Math.max(0, prev - 1))
setOrderTotal((prev) => (prev == null ? prev : Math.max(0, prev - 1)))
```

`confirmBulkDelete` (current lines 568-585) — where it currently does
`setOrderRecords([])` / `setSnapshotRecords([])`, also reset:

```ts
setOrderRecords([]); setOrderOffset(0); setOrderHasMore(false); setOrderTotal(0)
// (or the snapshot equivalents)
```

`BulkDeleteConfirmModal` invocation (current lines 755-777) — `body` copy
picks the counted variant when the total is known:

```ts
body:
  bulkDeleteConfirm === 'orders'
    ? orderTotal != null
      ? t.accountRecords.bulkDeleteConfirmOrdersWithCount.replace('{count}', String(orderTotal))
      : t.accountRecords.bulkDeleteConfirmOrders
    : snapshotTotal != null
      ? t.accountRecords.bulkDeleteConfirmSnapshotsWithCount.replace('{count}', String(snapshotTotal))
      : t.accountRecords.bulkDeleteConfirmSnapshots,
```

`AccountRecordsPanel` mount (current lines 671-704) — pass the new props:

```tsx
orderShownCount={orderRecords.length}
orderTotalCount={orderTotal}
snapshotShownCount={snapshotRecords.length}
snapshotTotalCount={snapshotTotal}
onLoadMoreOrders={orderHasMore ? () => void loadMoreOrders() : undefined}
onLoadMoreSnapshots={snapshotHasMore ? () => void loadMoreSnapshots() : undefined}
orderLoadingMore={orderLoadingMore}
snapshotLoadingMore={snapshotLoadingMore}
```

## i18n

**`accountRecords` — add:**
- `loadMore` — "더 보기" / "Load more"
- `loadingMore` — "불러오는 중…" / "Loading more…"
- `loadMoreError` — "추가 기록을 불러오지 못했습니다." / "Could not load more records."
- `shownCount` — two-placeholder template, e.g. "총 {total}개 중 {shown}개 표시 중" / "Showing {shown} of {total}"
- `bulkDeleteConfirmOrdersWithCount` — e.g. "주문 시뮬레이션 기록 {count}개를 전부 삭제합니다. 되돌릴 수 없습니다." / "This will delete all {count} order simulation records. This cannot be undone."
- `bulkDeleteConfirmSnapshotsWithCount` — snapshot equivalent

Existing `bulkDeleteConfirmOrders` / `bulkDeleteConfirmSnapshots` are kept
as-is, now used only as the fallback when the count fetch failed.

**Minor adjacent cleanup (optional, flagging since found while investigating,
not required for pagination to work):** `myPage.snapshotsTitle`,
`orderHistoryTitle`, `recordsCount`, `recordsEmpty` are dead — leftovers from
the `StorageRow`s the 07-07 redesign removed. Safe to delete in
`types.ts`/`en.ts`/`ko.ts` in the same pass, or leave for a separate cleanup —
not deleting them does not conflict with anything in this design.

## CSS (`src/App.css`)

`.account-record-list-toolbar` (current `App.css:3050-3053`) — change
`justify-content: flex-end` to `space-between` so the new count `<span>` and
the existing bulk-delete button sit at opposite ends; add
`.account-record-count { color: var(--color-text-dim); font-size:
var(--font-size-xs); }`.

`.account-record-list` (current `App.css:2954-2961`) — add:
```css
max-height: 48rem;
overflow-y: auto;
```
(`48rem` ≈ 768px at default root size — roughly 3-4 order-history cards or
5-6 snapshot cards visible before scrolling; adjust to taste, not load-bearing
for the design). Existing `display: flex; flex-direction: column; gap:
var(--space-sm)` stay unchanged — a scrollable flex column needs no other
adjustment.

New `.account-record-load-more`:
```css
.account-record-load-more {
  align-self: center;
  margin-top: var(--space-sm);
}
```
(reuses the existing `.link-btn` base style, matching the individual-delete
and bulk-delete buttons' visual weight — no new button variant needed.)

No changes to `.account-record-tabs`/`.account-record-tab` — confirmed out of
scope, reserved for the pending UI/UX plan.

## Files Touched — Summary

| File | Change |
|---|---|
| `src/db/accountRecords.ts` | modified — `PaginatedRecords<T>`, `fetchOrderHistoryPage`, `fetchAccountSnapshotsPage`, `fetchRecentRecords` return shape gains `hasMoreOrders`/`hasMoreSnapshots` |
| `src/components/AccountRecordsPanel.tsx` | modified — count props, load-more props/button, toolbar layout |
| `src/components/MyPage.tsx` | modified — offset/hasMore/total/loadingMore state (×2 tabs), `loadMoreOrders`/`loadMoreSnapshots`, delete/bulk-delete handlers updated, `fetchRecordCounts` wired back in, `BulkDeleteConfirmModal` body picks counted copy |
| `src/i18n/types.ts`, `locales/en.ts`, `locales/ko.ts` | modified — keys listed above |
| `src/App.css` | modified — toolbar layout, list max-height/scroll, load-more button |

No migration, no RLS change — `.range()` needs neither.

## Testing

- `src/db/accountRecords.test.ts`:
  - `fetchOrderHistoryPage`/`fetchAccountSnapshotsPage`: mock client asserts
    `.range(offset, offset + limit)` args; `hasMore: true` when the mock
    returns `limit + 1` rows, `false` when it returns fewer; returned
    `records` length is capped at `limit` even when `limit + 1` rows came
    back.
  - `fetchRecentRecords`: extend existing coverage to assert
    `hasMoreOrders`/`hasMoreSnapshots` are present and correct for a mixed
    fixture (one table exhausted, one not).
  - `unavailable()` branch: add page-fetch equivalents of the existing
    null-client checks (mirrors the pattern at line 74-81).
- `src/components/AccountRecordsPanel.test.tsx`: load-more button hidden when
  `onLoadMoreOrders`/`onLoadMoreSnapshots` undefined; shown + busy-label swap
  when `orderLoadingMore`/`snapshotLoadingMore`; count span renders the
  interpolated `shownCount` string when `orderTotalCount`/`snapshotTotalCount`
  is not null, renders nothing when null.
- `src/components/MyPage.test.tsx`: extend with a case asserting
  `loadMoreOrders` appends to `orderRecords` and advances `orderOffset`
  without resetting `snapshotRecords` (independent-tab-state regression
  guard); a case asserting single delete decrements `orderOffset`/`orderTotal`
  by exactly one.
- `src/i18n/accountRecordsCopy.test.ts`: extend for the new keys in both
  locales.
- Manual: seed >20 order-history rows for a test account (via repeated order
  apply, or direct insert), confirm "더 보기" loads the next page, count text
  updates, exhausting the table hides the button; delete a row mid-list then
  load more and confirm no skipped/duplicated row; bulk-delete confirm shows
  the real total; confirm `.account-record-list` scrolls internally once
  height is exceeded rather than growing the page indefinitely; switch tabs
  after loading extra pages on one tab, confirm the other tab is unaffected
  and switching back preserves what was already loaded.
