import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { saveMemo } from './memos'

describe('memo upload transport', () => {
  it('sends bounded chunks and one atomic final request, without resending the unchanged suffix', async () => {
    const rpc = vi.fn(async (_name, args) => ({ data: { saved: args.p_final }, error: null }))
    const client = { rpc } as unknown as SupabaseClient
    const previous = 'suffix'.repeat(20000)
    expect(await saveMemo(client, 'number_sets', 'id', previous, '😀'.repeat(100001) + previous)).toBeNull()
    expect(rpc).toHaveBeenCalledTimes(3)
    const args = rpc.mock.calls.map(call => call[1])
    expect(args.map(arg => arg.p_index)).toEqual([0, 1, 2])
    expect(args.map(arg => arg.p_final)).toEqual([false, false, true])
    expect(args.map(arg => Array.from(arg.p_chunk).length)).toEqual([50000, 50000, 1])
    expect(args.every(arg => arg.p_delete_count === 0 && arg.p_offset === 0)).toBe(true)
    expect(new Set(args.map(arg => arg.p_upload_id)).size).toBe(1)
  })

  it('stops on an upload error without issuing the commit', async () => {
    const rpc = vi.fn().mockResolvedValueOnce({ data: { saved: false }, error: null })
      .mockResolvedValueOnce({ data: { error: 'memo_rate_limited' }, error: null })
    expect(await saveMemo({ rpc } as unknown as SupabaseClient, 'order_history', 'id', '', 'a'.repeat(150000)))
      .toBe('memo_rate_limited')
    expect(rpc).toHaveBeenCalledTimes(2)
    expect(rpc.mock.calls.every(call => call[1].p_final === false)).toBe(true)
  })

  it('resumes the same chunk after the rate window resets', async () => {
    vi.useFakeTimers()
    try {
      const rpc = vi.fn().mockResolvedValueOnce({ data: { error: 'memo_rate_limited', retry_after: 2 }, error: null })
        .mockResolvedValueOnce({ data: { saved: true }, error: null })
      const pending = saveMemo({ rpc } as unknown as SupabaseClient, 'number_sets', 'id', '', 'a')
      // SHA-256 is asynchronous native work, independent of fake timers.
      await vi.waitFor(() => expect(rpc).toHaveBeenCalledTimes(1))
      await vi.advanceTimersByTimeAsync(3000)
      expect(await pending).toBeNull()
      expect(rpc.mock.calls[1]).toEqual(rpc.mock.calls[0])
    } finally { vi.useRealTimers() }
  })
})
