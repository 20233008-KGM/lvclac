# Account Records Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real logged-in storage and lookup for calculator order simulation history and account snapshots.

**Architecture:** Add owner-scoped Supabase tables, a tested repository/payload layer, and a compact result-column records panel. Order history is created from calculator order simulation apply events; account snapshots are saved manually from the current calculator state.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Supabase JS, Supabase SQL migrations.

---

## File Structure

- Create: `supabase/migrations/005_account_records.sql`
  Defines `order_history` and `account_snapshots`, RLS policies, and indexes.
- Create: `src/db/accountRecords.ts`
  Owns record types, row mapping, payload builders, and Supabase repository functions.
- Create: `src/db/accountRecords.test.ts`
  Tests payload builders, row mapping, malformed JSON tolerance, and unavailable repository behavior.
- Create: `src/components/AccountRecordsPanel.tsx`
  Presentational panel with tabs, signed-out/empty/loading/error states, snapshot button, and delete actions.
- Create: `src/components/AccountRecordsPanel.test.tsx`
  Uses `react-dom/server` to verify important rendered states without a browser-only test dependency.
- Modify: `src/components/ResultPanel.tsx`
  Wires record fetching, snapshot creation, order apply recording, and records panel rendering.
- Modify: `src/i18n/types.ts`
  Adds structured `accountRecords` copy.
- Modify: `src/i18n/locales/ko.ts`
  Adds Korean UI copy and updates legal/privacy storage references.
- Modify: `src/i18n/locales/en.ts`
  Adds English UI copy and updates legal/privacy storage references.
- Create: `src/i18n/accountRecordsCopy.test.ts`
  Verifies required Korean and English copy exists and avoids real broker-order wording.
- Modify: `src/App.css`
  Adds compact panel, tab, record list, status, and responsive styles.

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/005_account_records.sql`

- [ ] **Step 1: Create the migration**

```sql
create table if not exists public.order_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  position_side text not null check (position_side in ('long', 'short')),
  order_contracts numeric not null,
  order_price numeric not null,
  before_inputs jsonb not null default '{}'::jsonb,
  after_inputs jsonb not null default '{}'::jsonb,
  before_result jsonb not null default '{}'::jsonb,
  after_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.account_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Account snapshot',
  inputs jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_history_user_created_idx
  on public.order_history(user_id, created_at desc);

create index if not exists account_snapshots_user_created_idx
  on public.account_snapshots(user_id, created_at desc);

alter table public.order_history enable row level security;
alter table public.account_snapshots enable row level security;

drop policy if exists "Order history is readable by owner" on public.order_history;
create policy "Order history is readable by owner"
on public.order_history for select
using ((select auth.uid()) = user_id);

drop policy if exists "Order history is insertable by owner" on public.order_history;
create policy "Order history is insertable by owner"
on public.order_history for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Order history is deletable by owner" on public.order_history;
create policy "Order history is deletable by owner"
on public.order_history for delete
using ((select auth.uid()) = user_id);

drop policy if exists "Account snapshots are readable by owner" on public.account_snapshots;
create policy "Account snapshots are readable by owner"
on public.account_snapshots for select
using ((select auth.uid()) = user_id);

drop policy if exists "Account snapshots are insertable by owner" on public.account_snapshots;
create policy "Account snapshots are insertable by owner"
on public.account_snapshots for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Account snapshots are deletable by owner" on public.account_snapshots;
create policy "Account snapshots are deletable by owner"
on public.account_snapshots for delete
using ((select auth.uid()) = user_id);
```

- [ ] **Step 2: Verify migration text**

Run: `rg -n "enable row level security|auth.uid|for update|service_role" supabase/migrations/005_account_records.sql`

Expected: RLS and owner policies are present; no update policy or service-role reference appears.

---

### Task 2: Repository And Payload Tests

**Files:**
- Create: `src/db/accountRecords.test.ts`
- Create: `src/db/accountRecords.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { calculateEvaluate, calculateOrder } from '../calc/leverage'
import { sampleInputs } from '../types'
import {
  buildAccountSnapshotPayload,
  buildOrderHistoryPayload,
  createAccountRecordsRepository,
  rowToAccountSnapshotRecord,
  rowToOrderHistoryRecord,
} from './accountRecords'

describe('account records repository helpers', () => {
  it('builds compact account snapshot payloads without mutating inputs', () => {
    const inputs = { ...sampleInputs }
    const result = calculateEvaluate(inputs)
    const payload = buildAccountSnapshotPayload(inputs, result, 'Morning check')

    expect(payload.title).toBe('Morning check')
    expect(payload.inputs).toEqual(inputs)
    expect(payload.result).toMatchObject({
      liquidationPrice: result.liquidationPrice,
      leverageRatio: result.leverageRatio,
      isAtRisk: result.isAtRisk,
    })
    expect(inputs).toEqual(sampleInputs)
  })

  it('builds order simulation history payloads from before and after states', () => {
    const beforeInputs = { ...sampleInputs, orderContracts: 1, orderPrice: 340 }
    const afterInputs = { ...beforeInputs, contracts: 3, accountEval: 10_000_010 }
    const orderResult = calculateOrder(beforeInputs)
    const payload = buildOrderHistoryPayload(beforeInputs, afterInputs, orderResult)

    expect(payload.positionSide).toBe('long')
    expect(payload.orderContracts).toBe(1)
    expect(payload.orderPrice).toBe(340)
    expect(payload.beforeInputs).toEqual(beforeInputs)
    expect(payload.afterInputs).toEqual(afterInputs)
    expect(payload.beforeResult).toHaveProperty('liquidationPrice')
    expect(payload.afterResult).toHaveProperty('liquidationPrice')
  })

  it('maps rows and tolerates malformed stored JSON', () => {
    const order = rowToOrderHistoryRecord({
      id: 'order-1',
      position_side: 'short',
      order_contracts: '2',
      order_price: '5000',
      before_inputs: 'broken',
      after_inputs: { positionSide: 'short', mode: 'order' },
      before_result: null,
      after_result: { leverageRatio: 2 },
      created_at: '2026-07-05T00:00:00.000Z',
    })

    expect(order.beforeInputs.positionSide).toBe('long')
    expect(order.afterInputs.positionSide).toBe('short')
    expect(order.orderContracts).toBe(2)
    expect(order.orderPrice).toBe(5000)

    const snapshot = rowToAccountSnapshotRecord({
      id: 'snap-1',
      title: '',
      inputs: null,
      result: { isAtRisk: true },
      created_at: '2026-07-05T00:00:00.000Z',
    })

    expect(snapshot.title).toBe('Account snapshot')
    expect(snapshot.inputs.mode).toBe('evaluate')
    expect(snapshot.result.isAtRisk).toBe(true)
  })

  it('returns unavailable errors when Supabase is not configured', async () => {
    const repo = createAccountRecordsRepository(null)

    await expect(repo.fetchRecentRecords('user-1')).resolves.toEqual({
      data: null,
      error: 'supabase_not_configured',
    })
  })
})
```

- [ ] **Step 2: Run tests to verify RED**

Run: `npm run test -- src/db/accountRecords.test.ts`

Expected: FAIL because `src/db/accountRecords.ts` does not exist.

- [ ] **Step 3: Implement repository and helpers**

Implement the exported types and functions used by the test. Repository methods:

```ts
createAccountRecordsRepository(client = supabase)
fetchRecentRecords(userId: string)
createOrderHistory(userId: string, payload: OrderHistoryPayload)
createAccountSnapshot(userId: string, payload: AccountSnapshotPayload)
deleteOrderHistory(userId: string, id: string)
deleteAccountSnapshot(userId: string, id: string)
```

Each method returns `{ data, error }` and checks `user_id` in delete queries.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `npm run test -- src/db/accountRecords.test.ts`

Expected: PASS.

---

### Task 3: Localized Copy Tests

**Files:**
- Create: `src/i18n/accountRecordsCopy.test.ts`
- Modify: `src/i18n/types.ts`
- Modify: `src/i18n/locales/ko.ts`
- Modify: `src/i18n/locales/en.ts`

- [ ] **Step 1: Write failing copy tests**

```ts
import { describe, expect, it } from 'vitest'
import { en } from './locales/en'
import { ko } from './locales/ko'

describe('account records copy', () => {
  it('provides Korean copy for account records without broker-order wording', () => {
    expect(ko.accountRecords.title).toBe('기록')
    expect(ko.accountRecords.orderHistoryTab).toBe('주문기록')
    expect(ko.accountRecords.snapshotsTab).toBe('계좌스냅샷')
    expect(ko.accountRecords.saveSnapshot).toBe('스냅샷 저장')
    expect(ko.accountRecords.orderHistoryEmpty).toContain('주문 시뮬레이션')
    expect(ko.accountRecords.orderHistoryEmpty).not.toContain('체결 주문')
  })

  it('provides English copy for account records without broker-order wording', () => {
    expect(en.accountRecords.title).toBe('Records')
    expect(en.accountRecords.orderHistoryTab).toBe('Order history')
    expect(en.accountRecords.snapshotsTab).toBe('Account snapshots')
    expect(en.accountRecords.saveSnapshot).toBe('Save snapshot')
    expect(en.accountRecords.orderHistoryEmpty).toContain('order simulation')
    expect(en.accountRecords.orderHistoryEmpty).not.toContain('executed order')
  })
})
```

- [ ] **Step 2: Run tests to verify RED**

Run: `npm run test -- src/i18n/accountRecordsCopy.test.ts`

Expected: FAIL because `accountRecords` copy does not exist.

- [ ] **Step 3: Add copy and legal/privacy updates**

Add `accountRecords` to `Messages`, `ko`, and `en`. Update legal storage copy so cloud-stored calculator records include `number_sets`, order simulation history, and account snapshots.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `npm run test -- src/i18n/accountRecordsCopy.test.ts`

Expected: PASS.

---

### Task 4: Presentational Panel Tests

**Files:**
- Create: `src/components/AccountRecordsPanel.test.tsx`
- Create: `src/components/AccountRecordsPanel.tsx`

- [ ] **Step 1: Write failing render tests**

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { en } from '../i18n/locales/en'
import { AccountRecordsPanel } from './AccountRecordsPanel'

describe('AccountRecordsPanel', () => {
  const baseProps = {
    copy: en.accountRecords,
    signedIn: true,
    activeTab: 'orders' as const,
    onTabChange: vi.fn(),
    loading: false,
    error: null,
    notice: null,
    orderRecords: [],
    snapshotRecords: [],
    onRetry: vi.fn(),
    onSaveSnapshot: vi.fn(),
    onDeleteOrder: vi.fn(),
    onDeleteSnapshot: vi.fn(),
  }

  it('renders signed-out login-required state', () => {
    const html = renderToStaticMarkup(<AccountRecordsPanel {...baseProps} signedIn={false} />)
    expect(html).toContain(en.accountRecords.loginRequired)
  })

  it('renders empty order history state', () => {
    const html = renderToStaticMarkup(<AccountRecordsPanel {...baseProps} />)
    expect(html).toContain(en.accountRecords.orderHistoryEmpty)
  })

  it('renders snapshot save button on snapshots tab', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel {...baseProps} activeTab="snapshots" />,
    )
    expect(html).toContain(en.accountRecords.saveSnapshot)
    expect(html).toContain(en.accountRecords.snapshotsEmpty)
  })
})
```

- [ ] **Step 2: Run tests to verify RED**

Run: `npm run test -- src/components/AccountRecordsPanel.test.tsx`

Expected: FAIL because `AccountRecordsPanel.tsx` does not exist.

- [ ] **Step 3: Implement presentational component**

Implement a controlled tab component with stable CSS classes, ARIA tab labels, empty/loading/error/notice states, and delete buttons.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `npm run test -- src/components/AccountRecordsPanel.test.tsx`

Expected: PASS.

---

### Task 5: Result Panel Integration

**Files:**
- Modify: `src/components/ResultPanel.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: Add account record state and fetch flow**

In `ResultPanel`, read `user` from `useAuth`, create repository with default Supabase client, and load recent records on signed-in user changes.

- [ ] **Step 2: Add snapshot save flow**

Pass current `inputs` and `evaluateResult` into `buildAccountSnapshotPayload`, call `createAccountSnapshot`, prepend the returned record, and show success or error notice.

- [ ] **Step 3: Add order apply record flow**

Before calling `onChange({ applyOrderScenario: true })`, compute:

```ts
const beforeInputs = inputs
const afterInputs = applyInputPatch(inputs, { applyOrderScenario: true })
const payload = buildOrderHistoryPayload(beforeInputs, afterInputs, orderResult)
```

Then apply the order and asynchronously create the history row. A save failure must not block the calculator state update.

- [ ] **Step 4: Add delete and retry flows**

Wire delete buttons to owner-scoped delete repository calls and local list removal. Retry re-runs the signed-in fetch.

- [ ] **Step 5: Add styles**

Use existing panel, tab, button, border, and text tokens. The records panel should fit below the order section without nested cards or oversized marketing styling.

- [ ] **Step 6: Run focused tests**

Run: `npm run test -- src/db/accountRecords.test.ts src/i18n/accountRecordsCopy.test.ts src/components/AccountRecordsPanel.test.tsx src/calc/mtmLink.test.ts`

Expected: PASS.

---

### Task 6: Final Verification

**Files:**
- All changed files

- [ ] **Step 1: Run full tests**

Run: `npm run test`

Expected: PASS. If unrelated pre-existing failures appear, record exact failing tests.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 3: Browser smoke check**

Run dev server: `npm run dev -- --host 127.0.0.1`.

Check desktop and mobile:

- Signed-out records panel shows login-required state.
- The result column does not overlap at desktop width.
- The records panel stacks without horizontal overflow on mobile.
- Existing order controls remain usable.

- [ ] **Step 4: Commit recommendation**

If tests and build pass, commit these feature files separately from unrelated existing auth-dialog work:

```bash
git add docs/superpowers/specs/2026-07-05-account-records-design.md \
  docs/superpowers/plans/2026-07-05-account-records.md \
  supabase/migrations/005_account_records.sql \
  src/db/accountRecords.ts \
  src/db/accountRecords.test.ts \
  src/components/AccountRecordsPanel.tsx \
  src/components/AccountRecordsPanel.test.tsx \
  src/components/ResultPanel.tsx \
  src/i18n/types.ts \
  src/i18n/locales/ko.ts \
  src/i18n/locales/en.ts \
  src/i18n/accountRecordsCopy.test.ts \
  src/App.css
git commit -m "feat: add account records storage"
```

Do not stage the pre-existing `src/styles/auth-dialog.css` or `src/components/auth/authDialogLayout.test.ts` changes unless the user explicitly asks.
