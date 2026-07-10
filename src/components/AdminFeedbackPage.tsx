import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BoardId } from '../config/boards'
import { BOARD_IDS } from '../config/boards'
import { useAuth } from '../context/AuthContext'
import type { AuthUser } from '../db/profile'
import {
  createFeedbackPostsRepository,
  FEEDBACK_STATUSES,
  type FeedbackPostRecord,
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
  onBoardFilterChange: (value: BoardFilter) => void
  onStatusFilterChange: (value: StatusFilter) => void
  onStatusChange: (postId: string, status: FeedbackStatus) => void
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
  onBoardFilterChange,
  onStatusFilterChange,
  onStatusChange,
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
                  <div className="admin-feedback-post__head">
                    <div>
                      <span className="admin-feedback-post__board">
                        {boardsCopy.items[post.boardId].title}
                      </span>
                      <h2>{post.title}</h2>
                    </div>
                    <label className="admin-feedback-status">
                      <span>{copy.status}</span>
                      <select
                        value={post.status}
                        disabled={busyPostId === post.id}
                        onChange={(event) => {
                          onStatusChange(post.id, event.currentTarget.value as FeedbackStatus)
                        }}
                      >
                        {FEEDBACK_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {copy.statusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </label>
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
    void loadPosts()
  }, [loadPosts])

  async function handleStatusChange(postId: string, status: FeedbackStatus) {
    if (busyPostId) return
    setBusyPostId(postId)
    setError(null)
    const result = await repository.updatePostStatus(postId, status)
    setBusyPostId(null)
    if (result.error !== null) {
      setError(t.adminFeedback.updateError)
      return
    }
    setPosts((current) => current.map((post) => (post.id === postId ? result.data : post)))
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
        onBoardFilterChange={setBoardFilter}
        onStatusFilterChange={setStatusFilter}
        onStatusChange={(postId, status) => void handleStatusChange(postId, status)}
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
