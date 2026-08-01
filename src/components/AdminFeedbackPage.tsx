import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BoardId } from '../config/boards'
import { BOARD_IDS } from '../config/boards'
import { useAuth } from '../context/AuthContext'
import type { AuthUser } from '../db/profile'
import {
  createFeedbackPostsRepository,
  FEEDBACK_PRIORITIES,
  FEEDBACK_STATUSES,
  type FeedbackPostRecord,
  type FeedbackPriority,
  type FeedbackStatus,
} from '../db/feedbackPosts'
import { useLanguage } from '../i18n'
import type { Messages } from '../i18n/types'
import { SiteFooter } from './SiteFooter'
import '../styles/pages.css'

type AdminCopy = Messages['adminFeedback']
type BoardsCopy = Messages['boards']
type BoardFilter = BoardId | 'all'
type StatusFilter = FeedbackStatus | 'all'

interface AdminFeedbackViewProps {
  copy: AdminCopy
  boardsCopy: BoardsCopy
  user: AuthUser | null
  loading: boolean
  error: string | null
  posts: FeedbackPostRecord[]
  boardFilter: BoardFilter
  statusFilter: StatusFilter
  busyPostId: string | null
  savedPostId: string | null
  onBoardFilterChange: (value: BoardFilter) => void
  onStatusFilterChange: (value: StatusFilter) => void
  onPostChange: (postId: string, patch: Partial<FeedbackPostRecord>) => void
  onSave: (post: FeedbackPostRecord) => void
  onRetry: () => void
}

export function AdminFeedbackView({
  copy,
  boardsCopy,
  user,
  loading,
  error,
  posts,
  boardFilter,
  statusFilter,
  busyPostId,
  savedPostId,
  onBoardFilterChange,
  onStatusFilterChange,
  onPostChange,
  onSave,
  onRetry,
}: AdminFeedbackViewProps) {
  if (!user) {
    return (
      <div className="admin-feedback-shell">
        <section className="admin-feedback-panel">
          <h1>{copy.loginRequiredTitle}</h1>
          <p>{copy.loginRequiredBody}</p>
        </section>
      </div>
    )
  }

  if (!user.isAdmin) {
    return (
      <div className="admin-feedback-shell">
        <section className="admin-feedback-panel">
          <h1>{copy.accessDeniedTitle}</h1>
          <p>{copy.accessDeniedBody}</p>
        </section>
      </div>
    )
  }

  return (
    <div className="admin-feedback-shell">
      <main className="admin-feedback-page">
        <header className="admin-feedback-header">
          <a className="my-page-back" href="/">
            {boardsCopy.portalCompany}
          </a>
          <div>
            <h1>{copy.title}</h1>
            <p>{copy.description}</p>
          </div>
        </header>

        <section className="admin-feedback-panel admin-feedback-filters">
          <label>
            <span>{copy.boardFilter}</span>
            <select
              value={boardFilter}
              onChange={(event) => onBoardFilterChange(event.currentTarget.value as BoardFilter)}
            >
              <option value="all">{copy.allBoards}</option>
              {BOARD_IDS.map((id) => (
                <option key={id} value={id}>
                  {boardsCopy.items[id].title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{copy.statusFilter}</span>
            <select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.currentTarget.value as StatusFilter)}
            >
              <option value="all">{copy.allStatuses}</option>
              {FEEDBACK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {copy.statusLabels[status]}
                </option>
              ))}
            </select>
          </label>
        </section>

        {error && (
          <div className="admin-feedback-error" role="alert">
            <span>{error}</span>
            <button type="button" className="link-btn" onClick={onRetry}>
              {copy.retry}
            </button>
          </div>
        )}

        <section className="admin-feedback-panel">
          {loading ? (
            <p role="status">{copy.loading}</p>
          ) : posts.length > 0 ? (
            <ul className="admin-feedback-list">
              {posts.map((post) => (
                <li key={post.id} className="admin-feedback-post">
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      onSave(post)
                    }}
                  >
                    <div className="admin-feedback-post__head">
                      <div>
                        <span className="admin-feedback-post__board">
                          {boardsCopy.items[post.boardId].title}
                        </span>
                        <h2>{post.title}</h2>
                      </div>
                      <div className="admin-feedback-post__routing">
                        <label className="admin-feedback-status">
                          <span>{copy.status}</span>
                          <select
                            value={post.status}
                            disabled={busyPostId === post.id}
                            onChange={(event) => {
                              onPostChange(post.id, {
                                status: event.currentTarget.value as FeedbackStatus,
                              })
                            }}
                          >
                            {FEEDBACK_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {copy.statusLabels[status]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="admin-feedback-status">
                          <span>{copy.priority}</span>
                          <select
                            value={post.priority}
                            disabled={busyPostId === post.id}
                            onChange={(event) => {
                              onPostChange(post.id, {
                                priority: event.currentTarget.value as FeedbackPriority,
                              })
                            }}
                          >
                            {FEEDBACK_PRIORITIES.map((priority) => (
                              <option key={priority} value={priority}>
                                {copy.priorityLabels[priority]}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>

                    <p className="admin-feedback-post__body">{post.body}</p>
                    <dl className="admin-feedback-meta">
                      <div>
                        <dt>{copy.author}</dt>
                        <dd>{post.author || boardsCopy.anonymous}</dd>
                      </div>
                      <div>
                        <dt>{copy.contact}</dt>
                        <dd>{post.contact || '-'}</dd>
                      </div>
                      <div>
                        <dt>{copy.createdAt}</dt>
                        <dd>{formatPostDate(post.createdAt)}</dd>
                      </div>
                    </dl>
                    {post.attachments.length > 0 && (
                      <ul className="admin-feedback-attachments">
                        {post.attachments.map((attachment) => (
                          <li key={attachment.path}>
                            {attachment.signedUrl ? (
                              <a href={attachment.signedUrl} target="_blank" rel="noopener noreferrer">
                                {attachment.name}
                              </a>
                            ) : (
                              <span>{attachment.name}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="admin-feedback-triage-grid">
                      <label>
                        <span>{copy.assignee}</span>
                        <input
                          type="text"
                          value={post.assignee}
                          maxLength={120}
                          placeholder={copy.assigneePlaceholder}
                          disabled={busyPostId === post.id}
                          onChange={(event) =>
                            onPostChange(post.id, { assignee: event.currentTarget.value })
                          }
                        />
                      </label>
                      <label>
                        <span>{copy.internalNote}</span>
                        <textarea
                          value={post.internalNote}
                          maxLength={4000}
                          rows={4}
                          placeholder={copy.internalNotePlaceholder}
                          disabled={busyPostId === post.id}
                          onChange={(event) =>
                            onPostChange(post.id, { internalNote: event.currentTarget.value })
                          }
                        />
                      </label>
                      <label>
                        <span>{copy.staffReply}</span>
                        <textarea
                          value={post.staffReply}
                          maxLength={4000}
                          rows={4}
                          placeholder={copy.staffReplyPlaceholder}
                          disabled={busyPostId === post.id}
                          onChange={(event) =>
                            onPostChange(post.id, { staffReply: event.currentTarget.value })
                          }
                        />
                        <small>{copy.staffReplyHint}</small>
                      </label>
                    </div>

                    <div className="admin-feedback-post__actions">
                      <button
                        type="submit"
                        className="contact-form__submit"
                        disabled={busyPostId === post.id}
                      >
                        {busyPostId === post.id ? copy.saving : copy.save}
                      </button>
                      {savedPostId === post.id && (
                        <span className="contact-form__success" role="status">
                          {copy.saved}
                        </span>
                      )}
                    </div>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p>{copy.empty}</p>
          )}
        </section>
      </main>
    </div>
  )
}

export function AdminFeedbackPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const repository = useMemo(() => createFeedbackPostsRepository(), [])
  const [posts, setPosts] = useState<FeedbackPostRecord[]>([])
  const [boardFilter, setBoardFilter] = useState<BoardFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyPostId, setBusyPostId] = useState<string | null>(null)
  const [savedPostId, setSavedPostId] = useState<string | null>(null)

  const loadPosts = useCallback(async () => {
    if (!user?.isAdmin) {
      setPosts([])
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    const result = await repository.fetchAdminPosts({
      boardId: boardFilter,
      status: statusFilter,
      limit: 100,
    })
    if (result.error !== null) {
      setError(t.adminFeedback.loadError)
      setLoading(false)
      return
    }

    const withSignedAttachments = await Promise.all(
      result.data.map(async (post) => {
        if (post.attachments.length === 0) return post
        const signed = await repository.createSignedAttachmentUrls(post.attachments)
        return signed.error === null ? { ...post, attachments: signed.data } : post
      }),
    )
    setPosts(withSignedAttachments)
    setLoading(false)
  }, [boardFilter, repository, statusFilter, t.adminFeedback.loadError, user?.isAdmin])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPosts()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadPosts])

  function handlePostChange(postId: string, patch: Partial<FeedbackPostRecord>) {
    setSavedPostId(null)
    setPosts((current) =>
      current.map((post) => (post.id === postId ? { ...post, ...patch } : post)),
    )
  }

  async function handleSave(post: FeedbackPostRecord) {
    if (busyPostId) return
    setBusyPostId(post.id)
    setSavedPostId(null)
    setError(null)
    const result = await repository.updatePostTriage(post.id, {
      status: post.status,
      priority: post.priority,
      assignee: post.assignee,
      internalNote: post.internalNote,
      staffReply: post.staffReply,
    })
    setBusyPostId(null)
    if (result.error !== null) {
      setError(t.adminFeedback.updateError)
      return
    }
    setPosts((current) => current.map((item) => (item.id === post.id ? result.data : item)))
    setSavedPostId(post.id)
  }

  return (
    <>
      <AdminFeedbackView
        copy={t.adminFeedback}
        boardsCopy={t.boards}
        user={user}
        loading={loading}
        error={error}
        posts={posts}
        boardFilter={boardFilter}
        statusFilter={statusFilter}
        busyPostId={busyPostId}
        savedPostId={savedPostId}
        onBoardFilterChange={setBoardFilter}
        onStatusFilterChange={setStatusFilter}
        onPostChange={handlePostChange}
        onSave={(post) => void handleSave(post)}
        onRetry={() => void loadPosts()}
      />
      <SiteFooter />
    </>
  )
}

function formatPostDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
