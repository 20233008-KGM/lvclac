import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { en } from '../i18n/locales/en'
import type { FeedbackPostRecord } from '../db/feedbackPosts'
import { AdminFeedbackView } from './AdminFeedbackPage'

const post: FeedbackPostRecord = {
  id: 'post-1',
  boardId: 'dev-request',
  userId: 'user-1',
  title: 'Build a trade journal',
  body: 'I want a simple journal connected to calculator records.',
  author: 'Trader Kim',
  contact: 'trader@example.com',
  status: 'new',
  attachments: [],
  createdAt: '2026-07-09T10:00:00.000Z',
  updatedAt: '2026-07-09T10:00:00.000Z',
}

describe('AdminFeedbackView', () => {
  const baseProps = {
    copy: en.adminFeedback,
    boardsCopy: en.boards,
    user: { id: 'admin-1', email: 'admin@example.com', nickname: 'Admin', autoSaveOrderHistory: true, isAdmin: true },
    loading: false,
    error: null,
    posts: [post],
    boardFilter: 'all' as const,
    statusFilter: 'all' as const,
    busyPostId: null,
    onBoardFilterChange: vi.fn(),
    onStatusFilterChange: vi.fn(),
    onStatusChange: vi.fn(),
    onRetry: vi.fn(),
  }

  it('blocks non-admin users', () => {
    const html = renderToStaticMarkup(
      <AdminFeedbackView
        {...baseProps}
        user={{ ...baseProps.user, isAdmin: false }}
        posts={[]}
      />,
    )

    expect(html).toContain(en.adminFeedback.accessDeniedTitle)
    expect(html).toContain(en.adminFeedback.accessDeniedBody)
    expect(html).not.toContain('Build a trade journal')
  })

  it('renders all feedback posts with status management for admins', () => {
    const html = renderToStaticMarkup(<AdminFeedbackView {...baseProps} />)

    expect(html).toContain(en.adminFeedback.title)
    expect(html).toContain(en.adminFeedback.boardFilter)
    expect(html).toContain(en.adminFeedback.statusFilter)
    expect(html).toContain('Build a trade journal')
    expect(html).toContain('I want a simple journal connected to calculator records.')
    expect(html).toContain('trader@example.com')
    expect(html).toContain(en.adminFeedback.statusLabels.new)
    expect(html).toContain(en.adminFeedback.statusLabels.done)
  })
})
