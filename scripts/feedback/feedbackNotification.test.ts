import { describe, expect, it, vi } from 'vitest'
import {
  handleFeedbackNotification,
  readFeedbackNotificationConfig,
  type FeedbackNotificationConfig,
  type FeedbackNotificationDeps,
} from './feedbackNotification'

const config: FeedbackNotificationConfig = {
  supabaseUrl: 'https://example.supabase.co',
  serviceRoleKey: 'service-role',
  resendApiKey: 'resend-key',
  from: 'LiqGuard <notify@example.com>',
  to: 'contact@example.com',
  appUrl: 'https://dev.example.com',
}

function createDeps(overrides: Partial<FeedbackNotificationDeps> = {}): FeedbackNotificationDeps {
  return {
    verifyUser: vi.fn().mockResolvedValue('user-1'),
    getPost: vi.fn().mockResolvedValue({
      id: 'post-1',
      user_id: 'user-1',
      board_id: 'bugs',
      title: 'Wrong result',
      body: 'Expected X but got Y',
      author: 'Trader',
      contact: 'trader@example.com',
      created_at: '2026-08-02T00:00:00.000Z',
    }),
    claim: vi.fn().mockResolvedValue('claimed'),
    send: vi.fn().mockResolvedValue('email-1'),
    markSent: vi.fn().mockResolvedValue(undefined),
    release: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('feedback notification handler', () => {
  it('requires all server-only notification configuration', () => {
    expect(
      readFeedbackNotificationConfig({
        VITE_SUPABASE_URL: 'https://example.supabase.co/',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role',
        RESEND_API_KEY: 'resend-key',
        FEEDBACK_NOTIFICATION_FROM: 'LiqGuard <notify@example.com>',
        FEEDBACK_NOTIFICATION_TO: 'contact@example.com',
        APP_URL: 'https://dev.example.com/',
      }),
    ).toEqual(config)
    expect(readFeedbackNotificationConfig({ VITE_SUPABASE_URL: config.supabaseUrl })).toBeNull()
  })

  it('rejects missing authentication and posts owned by another user', async () => {
    await expect(
      handleFeedbackNotification(config, { accessToken: null, postId: 'post-1' }, createDeps()),
    ).resolves.toEqual({ status: 401, body: { ok: false, error: 'unauthorized' } })

    const deps = createDeps({ verifyUser: vi.fn().mockResolvedValue('user-2') })
    await expect(
      handleFeedbackNotification(config, { accessToken: 'token', postId: 'post-1' }, deps),
    ).resolves.toEqual({
      status: 404,
      body: { ok: false, error: 'feedback_post_not_found' },
    })
  })

  it('sends and records a claimed notification', async () => {
    const deps = createDeps()
    const result = await handleFeedbackNotification(
      config,
      { accessToken: 'token', postId: 'post-1' },
      deps,
    )

    expect(result).toEqual({ status: 200, body: { ok: true, state: 'sent' } })
    expect(deps.send).toHaveBeenCalledOnce()
    expect(deps.markSent).toHaveBeenCalledWith('post-1', 'email-1')
    expect(deps.release).not.toHaveBeenCalled()
  })

  it('does not send duplicate or concurrently processing notifications', async () => {
    const sentDeps = createDeps({ claim: vi.fn().mockResolvedValue('already_sent') })
    const processingDeps = createDeps({ claim: vi.fn().mockResolvedValue('processing') })

    await expect(
      handleFeedbackNotification(config, { accessToken: 'token', postId: 'post-1' }, sentDeps),
    ).resolves.toEqual({ status: 200, body: { ok: true, state: 'already_sent' } })
    await expect(
      handleFeedbackNotification(
        config,
        { accessToken: 'token', postId: 'post-1' },
        processingDeps,
      ),
    ).resolves.toEqual({ status: 202, body: { ok: true, state: 'processing' } })
    expect(sentDeps.send).not.toHaveBeenCalled()
    expect(processingDeps.send).not.toHaveBeenCalled()
  })

  it('releases the claim when the provider fails', async () => {
    const deps = createDeps({ send: vi.fn().mockRejectedValue(new Error('provider down')) })
    const result = await handleFeedbackNotification(
      config,
      { accessToken: 'token', postId: 'post-1' },
      deps,
    )

    expect(result).toEqual({
      status: 502,
      body: { ok: false, error: 'notification_failed' },
    })
    expect(deps.release).toHaveBeenCalledWith('post-1', 'provider down')
  })
})
