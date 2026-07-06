# Order History and Account Snapshots

## Context

Logged-in users can already save one calculator input set to Supabase `number_sets`.
The next account feature is to keep practical records from calculator use:
order history and account snapshots. These records contain sensitive account
numbers, so they must follow the same conservative storage principle as cloud
input saving: explicit logged-in cloud storage, owner-only access, clear copy,
and deletion.

This feature does not connect to a broker and does not represent real brokerage
orders. "Order history" means records created by this calculator when the user
applies an order simulation to the account.

## Goals

- Let logged-in users review recent calculator order simulation records.
- Let logged-in users manually save account snapshots from the current
  calculator state.
- Store records in Supabase with row-level security so only the owner can read,
  create, and delete their own records.
- Show loading, empty, error, success, and delete states in the UI.
- Avoid analytics or UI copy that treats simulated orders as actual executed
  broker orders.
- Keep the first implementation narrow enough to ship and verify.

## Non-Goals

- Broker integration, exchange order import, or automatic trade confirmation.
- Editing historical records after creation.
- Restoring a snapshot into the calculator.
- Search, filtering, export, or pagination beyond a small recent-record limit.
- Pro limits or billing gates for record count.
- Recording signed-out local history.

## Data Model

Create two Supabase tables.

`public.order_history`

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `position_side text not null check (position_side in ('long', 'short'))`
- `order_contracts numeric not null`
- `order_price numeric not null`
- `before_inputs jsonb not null default '{}'::jsonb`
- `after_inputs jsonb not null default '{}'::jsonb`
- `before_result jsonb not null default '{}'::jsonb`
- `after_result jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

`public.account_snapshots`

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `title text not null default 'Account snapshot'`
- `inputs jsonb not null default '{}'::jsonb`
- `result jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

Both tables enable RLS. Policies allow authenticated users to select, insert,
and delete rows only when `(select auth.uid()) = user_id`. Update policies are
omitted in v1 because records are immutable after creation.

Indexes:

- `order_history_user_created_idx on public.order_history(user_id, created_at desc)`
- `account_snapshots_user_created_idx on public.account_snapshots(user_id, created_at desc)`

## Record Shape

The repository layer exposes sanitized TypeScript records instead of raw
Supabase rows.

Order history stores:

- side, order contracts, order price
- before calculator inputs from the moment before applying the order
- after calculator inputs returned by the apply action
- compact before/after result summary: liquidation, tolerance, leverage,
  maintenance margin, available margin, and at-risk state
- created timestamp

Account snapshots store:

- title generated from the timestamp or localized label
- current calculator inputs
- compact current result summary: liquidation, tolerance, leverage, maintenance
  margin, available margin, and at-risk state
- created timestamp

Stored JSON is parsed through the same stored-input normalizer already used by
cloud input saving. Broken or unexpected JSON must not crash the UI.

## UI Behavior

Add a logged-in-only records panel near the result column, below the existing
order section.

Panel requirements:

- Two tabs: order history and account snapshots.
- Signed-out state: a compact prompt that login is required.
- Loading state while fetching records.
- Empty states for each tab.
- Error state with a retry action.
- Delete action for individual records.
- Snapshot tab includes a "Save snapshot" button.
- Order history records are created automatically after the user confirms
  `계좌에 확정` / `Apply to account` in order simulation.
- If automatic order record saving fails, the order application should still
  update the calculator, but the UI must show a non-blocking failure notice.

The UI copy must say "order simulation history" or equivalent. It must not say
"executed order", "broker order", or imply brokerage confirmation.

## Data Flow

1. Records panel reads `user.id` from `AuthContext`.
2. On login, it fetches recent order history and account snapshots.
3. On logout, it clears loaded records.
4. Snapshot save sends current inputs and current evaluate result summary to
   Supabase.
5. Order apply wraps the existing `applyOrderScenario` flow:
   before applying, capture the current inputs and order result summary;
   after applying, persist a history row with before and after data.
6. Deleting a row removes it from Supabase and then from local UI state.

Supabase errors map to a generic localized failure message in v1.

## Privacy, Security, And Legal Notes

- Records contain account-equity and position numbers. The UI must explain that
  these records are stored in the user's Supabase account.
- RLS must enforce owner-only access. UI login checks are not sufficient.
- No service-role key or secret may be used in the client.
- Analytics events, if added in a future measurement task, must not include numeric account values,
  order sizes, prices, emails, or row IDs.
- Terms and privacy copy should mention order simulation history and account
  snapshots as cloud-stored calculator records.

## Testing And Verification

Automated tests:

- Repository mappers parse valid rows and tolerate invalid stored JSON.
- Repository functions return unavailable errors when Supabase is not
  configured.
- Payload builders create compact summaries without mutating calculator inputs.
- i18n copy exists in Korean and English for tabs, buttons, states, and notices.
- Existing order apply and undo tests continue to pass.

Manual/browser verification:

- Signed-out records panel shows login-required copy.
- Signed-in empty states render for both tabs.
- Snapshot save creates and displays a row.
- Order apply creates and displays an order simulation row.
- Delete removes rows.
- Supabase failure shows a non-blocking error.
- Mobile layout has no overflow or overlapping controls.

Run at minimum:

- Relevant Vitest tests for new repository/payload/i18n behavior.
- Existing order scenario tests.
- `npm run build`.

## Deferred Risks

- Actual Supabase project migration and RLS advisor verification require access
  to the target project.
- Real account E2E requires configured email or OAuth login.
- There is no restore-from-snapshot action in v1, so snapshots are review-only.
- Record retention limits and Pro gating remain product decisions for a future
  release.
