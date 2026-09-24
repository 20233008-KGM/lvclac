import type { SupabaseClient } from '@supabase/supabase-js'
import { memoChunks, memoHash, memoPatch, normalizeMemo } from '../utils/memo'

export type MemoTable = 'number_sets' | 'account_snapshots' | 'order_history'

// Bounded changed-range uploads, committed atomically. Interrupted uploads
// never change the saved note. The previous hash prevents stale overwrites.
export async function saveMemo(
  client: SupabaseClient, table: MemoTable, id: string, previous: string, value: string,
): Promise<string | null> {
  const next = normalizeMemo(value) ?? ''
  const before = normalizeMemo(previous) ?? ''
  if (before === next) return null
  const patch = memoPatch(before, next)
  const expectedHash = await memoHash(before)
  const resultHash = await memoHash(next)
  const uploadId = crypto.randomUUID()
  const chunks = memoChunks(patch.insert)
  let current = chunks.next()
  let index = 0
  while (!current.done) {
    const following = chunks.next()
    const args = {
      p_table: table, p_id: id, p_expected_hash: expectedHash, p_result_hash: resultHash,
      p_offset: patch.offset, p_delete_count: patch.deleteCount,
      p_upload_id: uploadId, p_index: index++, p_final: Boolean(following.done), p_chunk: current.value,
    }
    // Resume the same staged chunk after throttling; restarting a large upload
    // would repeatedly exhaust the byte window and never finish.
    for (let retry = 0; ; retry++) {
      const { data, error } = await client.rpc('save_memo_chunk', args)
      if (error) return error.message || 'memo_save_error'
      if (data?.error === 'memo_rate_limited' && retry < 2 &&
        Number.isFinite(data.retry_after) && data.retry_after > 0 && data.retry_after <= 60) {
        await new Promise(resolve => setTimeout(resolve, (data.retry_after + 1) * 1000))
        continue
      }
      if (data?.error) return String(data.error)
      if (data?.saved) return null
      break
    }
    current = following
  }
  return 'memo_save_error'
}
