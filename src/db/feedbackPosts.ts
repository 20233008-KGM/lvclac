import type { SupabaseClient } from '@supabase/supabase-js'
import type { BoardId } from '../config/boards'
import { BOARD_IDS } from '../config/boards'
import { supabase } from './supabaseClient'

export const FEEDBACK_ATTACHMENT_BUCKET = 'feedback-attachments'

export const FEEDBACK_STATUSES = [
  'new',
  'reviewed',
  'in_progress',
  'done',
  'on_hold',
] as const

export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]

export interface FeedbackPostAttachmentInput {
  name: string
  path: string
  mimeType: string
  size: number
}

export interface FeedbackPostAttachment extends FeedbackPostAttachmentInput {
  signedUrl?: string
}

export interface FeedbackPostRow {
  id: string
  board_id: unknown
  user_id: string
  title: string
  body: string
  author: string | null
  contact: string | null
  status: unknown
  attachments: unknown
  created_at: string
  updated_at: string
}

export interface FeedbackPostRecord {
  id: string
  boardId: BoardId
  userId: string
  title: string
  body: string
  author: string
  contact: string
  status: FeedbackStatus
  attachments: FeedbackPostAttachment[]
  createdAt: string
  updatedAt: string
}

export interface FeedbackPostInput {
  id?: string
  boardId: BoardId
  title: string
  body: string
  author: string
  contact: string
  attachments?: FeedbackPostAttachmentInput[]
}

export interface AdminFeedbackPostFilters {
  boardId?: BoardId | 'all'
  status?: FeedbackStatus | 'all'
  offset?: number
  limit?: number
}

type FeedbackPostResult<T> =
  | { data: T; error: null }
  | { data: null; error: string }

const FEEDBACK_POST_COLUMNS =
  'id,board_id,user_id,title,body,author,contact,status,attachments,created_at,updated_at'

function unavailable<T>(): FeedbackPostResult<T> {
  return { data: null, error: 'supabase_not_configured' }
}

function mapError(error: { message?: string } | null | undefined): string {
  return error?.message || 'feedback_posts_error'
}

export function isFeedbackStatus(value: unknown): value is FeedbackStatus {
  return typeof value === 'string' && FEEDBACK_STATUSES.includes(value as FeedbackStatus)
}

function toBoardId(value: unknown): BoardId {
  return BOARD_IDS.includes(value as BoardId) ? (value as BoardId) : 'suggestions'
}

function isAttachment(value: unknown): value is FeedbackPostAttachment {
  if (!value || typeof value !== 'object') return false
  const attachment = value as Record<string, unknown>
  return (
    typeof attachment.name === 'string' &&
    typeof attachment.path === 'string' &&
    typeof attachment.mimeType === 'string' &&
    typeof attachment.size === 'number'
  )
}

function toAttachments(value: unknown): FeedbackPostAttachment[] {
  return Array.isArray(value) ? value.filter(isAttachment) : []
}

export function rowToFeedbackPostRecord(row: FeedbackPostRow): FeedbackPostRecord {
  return {
    id: row.id,
    boardId: toBoardId(row.board_id),
    userId: row.user_id,
    title: row.title,
    body: row.body,
    author: row.author ?? '',
    contact: row.contact ?? '',
    status: isFeedbackStatus(row.status) ? row.status : 'new',
    attachments: toAttachments(row.attachments),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function postInputToInsert(userId: string, input: FeedbackPostInput) {
  return {
    ...(input.id ? { id: input.id } : {}),
    user_id: userId,
    board_id: input.boardId,
    title: input.title.trim(),
    body: input.body.trim(),
    author: input.author.trim(),
    contact: input.contact.trim(),
    status: 'new' satisfies FeedbackStatus,
    attachments: input.attachments ?? [],
  }
}

function safeFileName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, '-')
  const cleaned = trimmed.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-')
  return cleaned || 'attachment'
}

export function createFeedbackPostsRepository(
  client: SupabaseClient | null = supabase,
) {
  return {
    async fetchMyPosts(
      userId: string,
      boardId: BoardId,
    ): Promise<FeedbackPostResult<FeedbackPostRecord[]>> {
      if (!client) return unavailable()

      const { data, error } = await client
        .from('feedback_posts')
        .select(FEEDBACK_POST_COLUMNS)
        .eq('user_id', userId)
        .eq('board_id', boardId)
        .order('created_at', { ascending: false })

      if (error) return { data: null, error: mapError(error) }
      return { data: (data ?? []).map(rowToFeedbackPostRecord), error: null }
    },

    async fetchAdminPosts(
      filters: AdminFeedbackPostFilters = {},
    ): Promise<FeedbackPostResult<FeedbackPostRecord[]>> {
      if (!client) return unavailable()

      const offset = filters.offset ?? 0
      const limit = filters.limit ?? 50
      let query = client.from('feedback_posts').select(FEEDBACK_POST_COLUMNS)
      if (filters.boardId && filters.boardId !== 'all') {
        query = query.eq('board_id', filters.boardId)
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
        .returns<FeedbackPostRow[]>()

      if (error) return { data: null, error: mapError(error) }
      return { data: (data ?? []).map(rowToFeedbackPostRecord), error: null }
    },

    async createPost(
      userId: string,
      input: FeedbackPostInput,
    ): Promise<FeedbackPostResult<FeedbackPostRecord>> {
      if (!client) return unavailable()

      const { data, error } = await client
        .from('feedback_posts')
        .insert(postInputToInsert(userId, input))
        .select(FEEDBACK_POST_COLUMNS)
        .single<FeedbackPostRow>()

      if (error) return { data: null, error: mapError(error) }
      return { data: rowToFeedbackPostRecord(data), error: null }
    },

    async updatePostStatus(
      postId: string,
      status: FeedbackStatus,
    ): Promise<FeedbackPostResult<FeedbackPostRecord>> {
      if (!client) return unavailable()
      if (!isFeedbackStatus(status)) return { data: null, error: 'invalid_feedback_status' }

      const { data, error } = await client
        .from('feedback_posts')
        .update({ status })
        .eq('id', postId)
        .select(FEEDBACK_POST_COLUMNS)
        .single<FeedbackPostRow>()

      if (error) return { data: null, error: mapError(error) }
      return { data: rowToFeedbackPostRecord(data), error: null }
    },

    async uploadAttachments(
      userId: string,
      postId: string,
      files: File[],
    ): Promise<FeedbackPostResult<FeedbackPostAttachmentInput[]>> {
      if (!client) return unavailable()
      const uploaded: FeedbackPostAttachmentInput[] = []

      for (const file of files) {
        const path = `${userId}/${postId}/${safeFileName(file.name)}`
        const { error } = await client.storage
          .from(FEEDBACK_ATTACHMENT_BUCKET)
          .upload(path, file, {
            contentType: file.type,
            upsert: false,
          })
        if (error) return { data: null, error: mapError(error) }
        uploaded.push({
          name: file.name,
          path,
          mimeType: file.type,
          size: file.size,
        })
      }

      return { data: uploaded, error: null }
    },

    async createSignedAttachmentUrls(
      attachments: FeedbackPostAttachment[],
    ): Promise<FeedbackPostResult<FeedbackPostAttachment[]>> {
      if (!client) return unavailable()
      const next: FeedbackPostAttachment[] = []

      for (const attachment of attachments) {
        const { data, error } = await client.storage
          .from(FEEDBACK_ATTACHMENT_BUCKET)
          .createSignedUrl(attachment.path, 60 * 10)
        if (error) return { data: null, error: mapError(error) }
        next.push({ ...attachment, signedUrl: data.signedUrl })
      }

      return { data: next, error: null }
    },
  }
}
