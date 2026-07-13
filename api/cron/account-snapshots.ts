import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  createAccountSnapshotCronDeps,
  handleAccountSnapshotCron,
  readAccountSnapshotCronConfig,
  type AccountSnapshotCronDeps,
} from '../../scripts/accountSnapshots/automation'
import { bearerToken, sendJson } from '../../scripts/billing/nodeAdapter'

const NOOP_DEPS: AccountSnapshotCronDeps = {
  fetchDueSettings: async () => [],
  fetchActiveSubscription: async () => ({ active: false }),
  fetchAutoSnapshotSlots: async () => [],
  insertAutoSnapshot: async () => ({ ok: true }),
  markSlotRolledOver: async () => ({ ok: true }),
  updateSettingAfterRun: async () => ({ ok: true }),
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { ok: false, processed: 0, skipped: 0, failed: 0 })
  }

  const config = readAccountSnapshotCronConfig(process.env)
  const token = bearerToken(req)
  const deps = config ? createAccountSnapshotCronDeps(config) : NOOP_DEPS
  const result = await handleAccountSnapshotCron(
    config,
    { authorization: token ? `Bearer ${token}` : null },
    deps,
  )
  sendJson(res, result.status, result.body)
}
