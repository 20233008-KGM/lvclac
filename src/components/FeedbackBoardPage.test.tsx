import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { en } from '../i18n/locales/en'
import type { FeedbackPostRecord } from '../db/feedbackPosts'
import { FeedbackBoardView } from './FeedbackBoardPage'

const post: FeedbackPostRecord = {
  id: 'post-1',
  boardId: 'bugs',
  userId: 'user-1',
  title: 'Wrong liquidation result',
  body: 'Expected a lower liquidation price.',
  author: '',
  contact: 'me@example.com',
  status: 'new',
  attachments: [],
  createdAt: '2026-07-09T10:00:00.000Z',
  updatedAt: '2026-07-09T10:00:00.000Z',
}

describe('FeedbackBoardView', () => {
  const baseProps = {
    boardId: 'bugs' as const,
    copy: en.boards,
    optionalLabel: en.optional,
    authLoading: false,
    configured: true,
    user: { id: 'user-1', email: 'user@example.com', nickname: 'Trader Kim', autoSaveOrderHistory: true, isAdmin: false },
    posts: [post],
    loading: false,
    error: null,
    title: '',
    body: '',
    author: '',
    contact: '',
    files: [] as File[],
    attachmentError: null,
    submitSuccess: false,
    submitBusy: false,
    allowsAttachments: true,
    onTitleChange: vi.fn(),
    onBodyChange: vi.fn(),
    onAuthorChange: vi.fn(),
    onContactChange: vi.fn(),
    onAttachmentChange: vi.fn(),
    onRemoveAttachment: vi.fn(),
    onSubmit: vi.fn(),
    onLoginClick: vi.fn(),
    onRetry: vi.fn(),
  }

  it('requires login before rendering the feedback form', () => {
    const html = renderToStaticMarkup(
      <FeedbackBoardView {...baseProps} user={null} posts={[]} />,
    )

    expect(html).toContain(en.boards.loginRequiredTitle)
    expect(html).toContain(en.boards.loginRequiredBody)
    expect(html).toContain(en.boards.loginAction)
    expect(html).not.toContain(en.boards.writePost)
  })

  it('renders signed-in user posts as my posts, not device-local posts', () => {
    const html = renderToStaticMarkup(<FeedbackBoardView {...baseProps} />)

    expect(html).toContain(en.boards.writePost)
    expect(html).toContain(en.boards.postList)
    expect(html).toContain(en.boards.myPostListDesc)
    expect(html).toContain('Wrong liquidation result')
    expect(html).toContain('Expected a lower liquidation price.')
    expect(html).not.toContain('Saved on this device')
  })
})
