import { describe, expect, it, vi } from 'vitest'
import type { BoardId } from '../config/boards'
import {
  createFeedbackPostsRepository,
  isFeedbackStatus,
  rowToFeedbackPostRecord,
  type FeedbackPostAttachmentInput,
  type FeedbackPostRow,
} from './feedbackPosts'

const row: FeedbackPostRow = {
  id: 'post-1',
  board_id: 'bugs',
  user_id: 'user-1',
  title: 'Wrong result',
  body: 'Expected X but got Y',
  author: '',
  contact: 'me@example.com',
  status: 'new',
  attachments: [
    {
      name: 'screen.png',
      path: 'user-1/post-1/screen.png',
      mimeType: 'image/png',
      size: 1234,
    },
  ],
  created_at: '2026-07-09T10:00:00.000Z',
  updated_at: '2026-07-09T10:00:00.000Z',
}

describe('feedback posts repository helpers', () => {
  it('maps database rows and tolerates malformed status values', () => {
    const record = rowToFeedbackPostRecord({
      ...row,
      status: 'unexpected',
      attachments: 'broken',
    })

    expect(record).toMatchObject({
      id: 'post-1',
      boardId: 'bugs',
      userId: 'user-1',
      title: 'Wrong result',
      body: 'Expected X but got Y',
      author: '',
      contact: 'me@example.com',
      status: 'new',
      attachments: [],
    })
  })

  it('recognizes only supported admin status values', () => {
    expect(isFeedbackStatus('new')).toBe(true)
    expect(isFeedbackStatus('reviewed')).toBe(true)
    expect(isFeedbackStatus('in_progress')).toBe(true)
    expect(isFeedbackStatus('done')).toBe(true)
    expect(isFeedbackStatus('on_hold')).toBe(true)
    expect(isFeedbackStatus('deleted')).toBe(false)
  })

  it('returns unavailable errors when Supabase is not configured', async () => {
    const repo = createFeedbackPostsRepository(null)

    await expect(repo.fetchMyPosts('user-1', 'bugs')).resolves.toEqual({
      data: null,
      error: 'supabase_not_configured',
    })
  })

  it('creates posts with owner, board, default status, and attachment metadata', async () => {
    const inserted: unknown[] = []
    const attachments: FeedbackPostAttachmentInput[] = [
      {
        name: 'screen.png',
        path: 'user-1/post-1/screen.png',
        mimeType: 'image/png',
        size: 1234,
      },
    ]
    const client = {
      from(table: string) {
        expect(table).toBe('feedback_posts')
        return {
          insert(payload: unknown) {
            inserted.push(payload)
            return {
              select(columns: string) {
                expect(columns).toContain('attachments')
                return {
                  single: () => Promise.resolve({ data: row, error: null }),
                }
              },
            }
          },
        }
      },
    }

    const repo = createFeedbackPostsRepository(client as never)
    const result = await repo.createPost('user-1', {
      boardId: 'bugs',
      title: ' Wrong result ',
      body: ' Expected X but got Y ',
      author: ' ',
      contact: ' me@example.com ',
      attachments,
    })

    expect(result.error).toBeNull()
    expect(inserted).toEqual([
      {
        user_id: 'user-1',
        board_id: 'bugs',
        title: 'Wrong result',
        body: 'Expected X but got Y',
        author: '',
        contact: 'me@example.com',
        status: 'new',
        attachments,
      },
    ])
    expect(result.data?.attachments[0]?.path).toBe('user-1/post-1/screen.png')
  })

  it('can create a post with a caller-provided id for attachment paths', async () => {
    const inserted: unknown[] = []
    const client = {
      from() {
        return {
          insert(payload: unknown) {
            inserted.push(payload)
            return {
              select() {
                return {
                  single: () => Promise.resolve({ data: { ...row, id: 'post-fixed' }, error: null }),
                }
              },
            }
          },
        }
      },
    }

    const repo = createFeedbackPostsRepository(client as never)
    const result = await repo.createPost('user-1', {
      id: 'post-fixed',
      boardId: 'bugs',
      title: 'Bug',
      body: 'Details',
      author: '',
      contact: '',
      attachments: [],
    })

    expect(result.data?.id).toBe('post-fixed')
    expect(inserted).toEqual([
      expect.objectContaining({
        id: 'post-fixed',
        user_id: 'user-1',
      }),
    ])
  })

  it('fetches only the signed-in user posts for a board', async () => {
    const calls: { column: string; value: string }[] = []
    const client = {
      from(table: string) {
        expect(table).toBe('feedback_posts')
        return {
          select() {
            return {
              eq(column: string, value: string) {
                calls.push({ column, value })
                return this
              },
              order(column: string, options: { ascending: boolean }) {
                expect(column).toBe('created_at')
                expect(options).toEqual({ ascending: false })
                return Promise.resolve({ data: [row], error: null })
              },
            }
          },
        }
      },
    }

    const repo = createFeedbackPostsRepository(client as never)
    const result = await repo.fetchMyPosts('user-1', 'bugs')

    expect(result.data).toHaveLength(1)
    expect(calls).toEqual([
      { column: 'user_id', value: 'user-1' },
      { column: 'board_id', value: 'bugs' },
    ])
  })

  it('fetches admin posts with board, status, and limit filters', async () => {
    const calls: Array<{ method: string; args: unknown[] }> = []
    const client = {
      from(table: string) {
        expect(table).toBe('feedback_posts')
        return {
          select(columns: string) {
            calls.push({ method: 'select', args: [columns] })
            return {
              eq(column: string, value: string) {
                calls.push({ method: 'eq', args: [column, value] })
                return this
              },
              order(column: string, options: { ascending: boolean }) {
                calls.push({ method: 'order', args: [column, options] })
                return this
              },
              range(from: number, to: number) {
                calls.push({ method: 'range', args: [from, to] })
                return {
                  returns: () => Promise.resolve({ data: [row], error: null }),
                }
              },
            }
          },
        }
      },
    }

    const repo = createFeedbackPostsRepository(client as never)
    const result = await repo.fetchAdminPosts({ boardId: 'bugs', status: 'new', limit: 20 })

    expect(result.error).toBeNull()
    expect(calls).toEqual([
      { method: 'select', args: ['id,board_id,user_id,title,body,author,contact,status,attachments,created_at,updated_at'] },
      { method: 'eq', args: ['board_id', 'bugs'] },
      { method: 'eq', args: ['status', 'new'] },
      { method: 'order', args: ['created_at', { ascending: false }] },
      { method: 'range', args: [0, 19] },
    ])
  })

  it('updates admin status only with supported values', async () => {
    const updates: unknown[] = []
    const client = {
      from(table: string) {
        expect(table).toBe('feedback_posts')
        return {
          update(payload: unknown) {
            updates.push(payload)
            return {
              eq(column: string, id: string) {
                expect(column).toBe('id')
                expect(id).toBe('post-1')
                return {
                  select() {
                    return {
                      single: () => Promise.resolve({ data: { ...row, status: 'done' }, error: null }),
                    }
                  },
                }
              },
            }
          },
        }
      },
    }

    const repo = createFeedbackPostsRepository(client as never)

    await expect(repo.updatePostStatus('post-1', 'done')).resolves.toMatchObject({
      data: { status: 'done' },
      error: null,
    })
    await expect(repo.updatePostStatus('post-1', 'deleted' as never)).resolves.toEqual({
      data: null,
      error: 'invalid_feedback_status',
    })
    expect(updates).toEqual([{ status: 'done' }])
  })

  it('uploads attachments under the user and post path', async () => {
    const upload = vi.fn().mockResolvedValue({ error: null })
    const client = {
      storage: {
        from(bucket: string) {
          expect(bucket).toBe('feedback-attachments')
          return { upload }
        },
      },
    }
    const file = new File(['image'], 'a screen.png', { type: 'image/png' })
    const repo = createFeedbackPostsRepository(client as never)

    const result = await repo.uploadAttachments('user-1', 'post-1', [file])

    expect(result.error).toBeNull()
    expect(upload).toHaveBeenCalledWith('user-1/post-1/a-screen.png', file, {
      contentType: 'image/png',
      upsert: false,
    })
    expect(result.data).toEqual([
      {
        name: 'a screen.png',
        path: 'user-1/post-1/a-screen.png',
        mimeType: 'image/png',
        size: 5,
      },
    ])
  })
})
