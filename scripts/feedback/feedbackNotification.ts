import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const CLAIM_TIMEOUT_MS = 5 * 60 * 1000

export interface FeedbackNotificationConfig {
  supabaseUrl: string
  serviceRoleKey: string
  resendApiKey: string
  from: string
  to: string
  appUrl: string
}
interface FeedbackPostForNotification {
  id: string
  user_id: string
  board_id: string
  title: string
  body: string
  author: string
  contact: string
  created_at: string
}

interface NotificationRow {
  post_id: string
  claimed_at: string | null
  sent_at: string | null
  attempt_count: number
}

type ClaimResult = 'claimed' | 'already_sent' | 'processing'

export interface FeedbackNotificationDeps {
  verifyUser(accessToken: string): Promise<string | null>
  getPost(postId: string): Promise<FeedbackPostForNotification | null>
  claim(postId: string): Promise<ClaimResult>
  send(post: FeedbackPostForNotification): Promise<string>
  markSent(postId: string, providerMessageId: string): Promise<void>
  release(postId: string, error: string): Promise<void>
}

export interface FeedbackNotificationInput {
  accessToken: string | null
  postId: string | null
}

export interface FeedbackNotificationResult {
  status: number
  body: { ok: boolean; error?: string; state?: string }
}

export function readFeedbackNotificationConfig(
  env: Record<string, string | undefined>,
): FeedbackNotificationConfig | null {
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  const resendApiKey = env.RESEND_API_KEY
  const from = env.FEEDBACK_NOTIFICATION_FROM
  const to = env.FEEDBACK_NOTIFICATION_TO
  const appUrl = env.APP_URL || env.VITE_SITE_URL
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !from || !to || !appUrl) return null
  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ''),
    serviceRoleKey,
    resendApiKey,
    from,
    to,
    appUrl: appUrl.replace(/\/$/, ''),
  }
}

export async function handleFeedbackNotification(
  config: FeedbackNotificationConfig | null,
  input: FeedbackNotificationInput,
  deps: FeedbackNotificationDeps | null,
): Promise<FeedbackNotificationResult> {
  if (!config || !deps) return { status: 503, body: { ok: false, error: 'not_configured' } }
  if (!input.accessToken) return { status: 401, body: { ok: false, error: 'unauthorized' } }
  if (!input.postId) return { status: 400, body: { ok: false, error: 'post_id_required' } }

  const userId = await deps.verifyUser(input.accessToken)
  if (!userId) return { status: 401, body: { ok: false, error: 'unauthorized' } }

  const post = await deps.getPost(input.postId)
  if (!post || post.user_id !== userId) {
    return { status: 404, body: { ok: false, error: 'feedback_post_not_found' } }
  }

  const claim = await deps.claim(post.id)
  if (claim === 'already_sent') {
    return { status: 200, body: { ok: true, state: 'already_sent' } }
  }
  if (claim === 'processing') {
    return { status: 202, body: { ok: true, state: 'processing' } }
  }

  try {
    const providerMessageId = await deps.send(post)
    await deps.markSent(post.id, providerMessageId)
    return { status: 200, body: { ok: true, state: 'sent' } }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'notification_failed'
    await deps.release(post.id, message)
    return { status: 502, body: { ok: false, error: 'notification_failed' } }
  }
}

export function createFeedbackNotificationDeps(
  config: FeedbackNotificationConfig,
): FeedbackNotificationDeps {
  const client = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return {
    async verifyUser(accessToken) {
      const { data, error } = await client.auth.getUser(accessToken)
      return error ? null : (data.user?.id ?? null)
    },

    async getPost(postId) {
      const { data, error } = await client
        .from('feedback_posts')
        .select('id,user_id,board_id,title,body,author,contact,created_at')
        .eq('id', postId)
        .maybeSingle<FeedbackPostForNotification>()
      if (error) throw new Error(error.message)
      return data
    },

    claim: (postId) => claimNotification(client, postId),

    async send(post) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${config.resendApiKey}`,
          'content-type': 'application/json',
          'idempotency-key': `feedback-new/${post.id}`,
        },
        body: JSON.stringify({
          from: config.from,
          to: [config.to],
          subject: `[LiqGuard][${boardLabel(post.board_id)}] ${post.title}`,
          html: notificationHtml(post, `${config.appUrl}/admin/feedback`),
        }),
      })
      const payload = (await response.json().catch(() => ({}))) as { id?: string; message?: string }
      if (!response.ok || !payload.id) {
        throw new Error(payload.message || `resend_${response.status}`)
      }
      return payload.id
    },

    async markSent(postId, providerMessageId) {
      const { error } = await client
        .from('feedback_post_notifications')
        .update({
          sent_at: new Date().toISOString(),
          provider_message_id: providerMessageId,
          last_error: null,
        })
        .eq('post_id', postId)
      if (error) throw new Error(error.message)
    },

    async release(postId, errorMessage) {
      const { error } = await client
        .from('feedback_post_notifications')
        .update({ claimed_at: null, last_error: errorMessage.slice(0, 500) })
        .eq('post_id', postId)
      if (error) throw new Error(error.message)
    },
  }
}

async function claimNotification(client: SupabaseClient, postId: string): Promise<ClaimResult> {
  const now = new Date().toISOString()
  const { error: insertError } = await client.from('feedback_post_notifications').insert({
    post_id: postId,
    claimed_at: now,
    attempt_count: 1,
  })
  if (!insertError) return 'claimed'
  if (insertError.code !== '23505') throw new Error(insertError.message)

  const { data: current, error: currentError } = await client
    .from('feedback_post_notifications')
    .select('post_id,claimed_at,sent_at,attempt_count')
    .eq('post_id', postId)
    .single<NotificationRow>()
  if (currentError) throw new Error(currentError.message)
  if (current.sent_at) return 'already_sent'

  const claimedAt = current.claimed_at ? new Date(current.claimed_at).getTime() : 0
  if (claimedAt && Date.now() - claimedAt < CLAIM_TIMEOUT_MS) return 'processing'

  let query = client
    .from('feedback_post_notifications')
    .update({
      claimed_at: now,
      attempt_count: current.attempt_count + 1,
      last_error: null,
    })
    .eq('post_id', postId)
    .is('sent_at', null)
  query = current.claimed_at ? query.eq('claimed_at', current.claimed_at) : query.is('claimed_at', null)
  const { data: claimed, error: claimError } = await query.select('post_id').maybeSingle()
  if (claimError) throw new Error(claimError.message)
  return claimed ? 'claimed' : 'processing'
}

function boardLabel(boardId: string): string {
  if (boardId === 'bugs') return '버그 제보'
  if (boardId === 'dev-request') return '개발 의뢰'
  return '개선 제안'
}

function notificationHtml(post: FeedbackPostForNotification, adminUrl: string): string {
  return `
    <h1>새 ${escapeHtml(boardLabel(post.board_id))}</h1>
    <p><strong>${escapeHtml(post.title)}</strong></p>
    <p>${escapeHtml(post.body).replace(/\n/g, '<br>')}</p>
    <hr>
    <p>작성자: ${escapeHtml(post.author || '미입력')}</p>
    <p>연락처: ${escapeHtml(post.contact || '미입력')}</p>
    <p>접수 시각: ${escapeHtml(post.created_at)}</p>
    <p><a href="${escapeHtml(adminUrl)}">관리자 피드백함에서 확인</a></p>
  `.trim()
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
