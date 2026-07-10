import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import type { BoardId } from '../config/boards'
import {
  MAX_BOARD_ATTACHMENTS,
  validateImageFile,
  type AttachmentError,
} from '../lib/feedbackBoardImage'
import {
  createFeedbackPostsRepository,
  type FeedbackPostRecord,
} from '../db/feedbackPosts'
import { useAuth } from '../context/AuthContext'
import type { AuthUser } from '../db/profile'
import { useLanguage } from '../i18n'
import type { Messages } from '../i18n/types'
import { ContactShell } from './ContactShell'

interface FeedbackBoardPageProps {
  boardId: BoardId
}

const AuthModal = lazy(() => import('./auth/AuthModal').then((mod) => ({ default: mod.AuthModal })))

type BoardsCopy = Messages['boards']

interface FeedbackBoardViewProps {
  boardId: BoardId
  copy: BoardsCopy
  optionalLabel: string
  authLoading: boolean
  configured: boolean
  user: AuthUser | null
  posts: FeedbackPostRecord[]
  loading: boolean
  error: string | null
  title: string
  body: string
  author: string
  contact: string
  files: File[]
  attachmentError: AttachmentError | null
  submitSuccess: boolean
  submitBusy: boolean
  allowsAttachments: boolean
  onTitleChange: (value: string) => void
  onBodyChange: (value: string) => void
  onAuthorChange: (value: string) => void
  onContactChange: (value: string) => void
  onAttachmentChange: (files: FileList | null) => void
  onRemoveAttachment: (index: number) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onLoginClick: () => void
  onRetry: () => void
}

function attachmentErrorMessage(copy: BoardsCopy, error: AttachmentError): string {
  switch (error) {
    case 'invalid_type':
      return copy.attachmentInvalidType
    case 'too_large':
      return copy.attachmentTooLarge
    case 'too_many':
      return copy.attachmentTooMany
  }
}

export function FeedbackBoardView({
  boardId,
  copy,
  optionalLabel,
  authLoading,
  configured,
  user,
  posts,
  loading,
  error,
  title,
  body,
  author,
  contact,
  files,
  attachmentError,
  submitSuccess,
  submitBusy,
  allowsAttachments,
  onTitleChange,
  onBodyChange,
  onAuthorChange,
  onContactChange,
  onAttachmentChange,
  onRemoveAttachment,
  onSubmit,
  onLoginClick,
  onRetry,
}: FeedbackBoardViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="contact-main">
      <p className="contact-main__notice">{copy.storageNotice}</p>

      {authLoading ? (
        <section className="contact-panel" aria-live="polite">
          <p>{copy.loading}</p>
        </section>
      ) : !user ? (
        <section className="contact-panel" aria-labelledby={`board-login-${boardId}`}>
          <h3 id={`board-login-${boardId}`} className="contact-panel__title">
            {copy.loginRequiredTitle}
          </h3>
          <p className="contact-panel__desc">{copy.loginRequiredBody}</p>
          <button
            type="button"
            className="contact-form__submit"
            disabled={!configured}
            onClick={onLoginClick}
          >
            {copy.loginAction}
          </button>
        </section>
      ) : (
        <>
          <section className="contact-panel" aria-labelledby={`board-form-${boardId}`}>
            <h3 id={`board-form-${boardId}`} className="contact-panel__title">
              {copy.writePost}
            </h3>
            <form className="contact-form" onSubmit={onSubmit}>
              <label className="contact-form__field">
                <span>{copy.postTitle}</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder={copy.postTitlePlaceholder}
                  required
                  maxLength={120}
                />
              </label>
              <label className="contact-form__field">
                <span>{copy.postBody}</span>
                <textarea
                  value={body}
                  onChange={(e) => onBodyChange(e.target.value)}
                  placeholder={copy.postBodyPlaceholder}
                  required
                  rows={5}
                  maxLength={4000}
                />
              </label>
              <label className="contact-form__field">
                <span>
                  {copy.postAuthor} {optionalLabel}
                </span>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => onAuthorChange(e.target.value)}
                  placeholder={copy.postAuthorPlaceholder}
                  maxLength={40}
                />
              </label>
              <label className="contact-form__field">
                <span>
                  {copy.postContact} {optionalLabel}
                </span>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => onContactChange(e.target.value)}
                  placeholder={copy.postContactPlaceholder}
                  maxLength={120}
                  autoComplete="email"
                />
              </label>
              {allowsAttachments && (
                <div className="contact-form__field">
                  <span>
                    {copy.postAttachments} {optionalLabel}
                  </span>
                  <p className="contact-form__hint">{copy.postAttachmentsHint}</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    multiple
                    className="contact-form__file-input"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      onAttachmentChange(event.currentTarget.files)
                      event.currentTarget.value = ''
                    }}
                  />
                  <button
                    type="button"
                    className="contact-form__attach-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={files.length >= MAX_BOARD_ATTACHMENTS || submitBusy}
                  >
                    {copy.addAttachment}
                  </button>
                  {attachmentError && (
                    <p className="contact-form__error" role="alert">
                      {attachmentErrorMessage(copy, attachmentError)}
                    </p>
                  )}
                  {files.length > 0 && (
                    <ul className="contact-attachments" aria-label={copy.postAttachments}>
                      {files.map((file, index) => (
                        <li key={`${file.name}-${index}`} className="contact-attachment">
                          <div className="contact-attachment__meta">
                            <span className="contact-attachment__name">{file.name}</span>
                            <button
                              type="button"
                              className="contact-attachment__remove"
                              onClick={() => onRemoveAttachment(index)}
                            >
                              {copy.removeAttachment}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <button type="submit" className="contact-form__submit" disabled={submitBusy}>
                {submitBusy ? copy.submitting : copy.submit}
              </button>
              {submitSuccess && (
                <p className="contact-form__success" role="status">
                  {copy.submitSuccess}
                </p>
              )}
            </form>
          </section>

          <section className="contact-panel" aria-labelledby={`board-list-${boardId}`}>
            <h3 id={`board-list-${boardId}`} className="contact-panel__title">
              {copy.postList}
            </h3>
            <p className="contact-panel__desc">{copy.myPostListDesc}</p>
            {error && (
              <div className="contact-form__error" role="alert">
                <span>{error}</span>
                <button type="button" className="link-btn" onClick={onRetry}>
                  {copy.retry}
                </button>
              </div>
            )}
            {loading ? (
              <p className="contact-panel__desc" role="status">
                {copy.loading}
              </p>
            ) : posts.length > 0 ? (
              <ul className="contact-list">
                {posts.map((post) => (
                  <li key={post.id} className="contact-post">
                    <div className="contact-post__meta">
                      <span className="contact-post__author">
                        {post.author || copy.anonymous}
                      </span>
                      {post.contact && (
                        <span className="contact-post__contact">{post.contact}</span>
                      )}
                      <time className="contact-post__time" dateTime={post.createdAt}>
                        {formatPostDate(post.createdAt)}
                      </time>
                    </div>
                    <h4 className="contact-post__title">{post.title}</h4>
                    <p className="contact-post__body">{post.body}</p>
                    {post.attachments.length > 0 && (
                      <ul className="contact-post__attachments" aria-label={copy.postAttachments}>
                        {post.attachments.map((attachment, index) => (
                          <li key={`${post.id}-attachment-${index}`}>
                            {attachment.signedUrl ? (
                              <a
                                href={attachment.signedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="contact-post__attachment-link"
                              >
                                <img
                                  src={attachment.signedUrl}
                                  alt={attachment.name}
                                  className="contact-post__attachment-img"
                                />
                              </a>
                            ) : (
                              <span className="contact-post__attachment-name">
                                {attachment.name}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="contact-panel__desc">{copy.postsEmpty}</p>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export function FeedbackBoardPage({ boardId }: FeedbackBoardPageProps) {
  const { t } = useLanguage()
  const { user, loading: authLoading, configured } = useAuth()
  const repository = useMemo(() => createFeedbackPostsRepository(), [])
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [posts, setPosts] = useState<FeedbackPostRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [author, setAuthor] = useState('')
  const [contact, setContact] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [attachmentError, setAttachmentError] = useState<AttachmentError | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitBusy, setSubmitBusy] = useState(false)
  const allowsAttachments = boardId === 'bugs'

  useEffect(() => {
    try {
      localStorage.removeItem(`leverage-board-${boardId}`)
      if (boardId === 'bugs') localStorage.removeItem('leverage-board-defects')
    } catch {
      // ignore private mode / unavailable storage
    }
  }, [boardId])

  const loadPosts = useCallback(async () => {
    if (!user) {
      setPosts([])
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const result = await repository.fetchMyPosts(user.id, boardId)
    if (result.error !== null) {
      setError(t.boards.loadError)
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
  }, [boardId, repository, t.boards.loadError, user])

  useEffect(() => {
    void loadPosts()
  }, [loadPosts])

  function handleAttachmentChange(fileList: FileList | null) {
    if (!fileList?.length) return
    setAttachmentError(null)
    const next = [...files]
    for (const file of Array.from(fileList)) {
      if (next.length >= MAX_BOARD_ATTACHMENTS) {
        setAttachmentError('too_many')
        break
      }
      const validationError = validateImageFile(file)
      if (validationError) {
        setAttachmentError(validationError)
        continue
      }
      next.push(file)
    }
    setFiles(next)
  }

  function removeAttachment(index: number) {
    setFiles((current) => current.filter((_, i) => i !== index))
    setAttachmentError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || submitBusy || !title.trim() || !body.trim()) return

    setSubmitBusy(true)
    setError(null)
    setSubmitSuccess(false)
    const postId = crypto.randomUUID()
    const uploadResult =
      allowsAttachments && files.length > 0
        ? await repository.uploadAttachments(user.id, postId, files)
        : { data: [], error: null as string | null }

    if (uploadResult.error !== null) {
      setError(t.boards.submitError)
      setSubmitBusy(false)
      return
    }

    const createResult = await repository.createPost(user.id, {
      id: postId,
      boardId,
      title,
      body,
      author,
      contact,
      attachments: uploadResult.data,
    })

    setSubmitBusy(false)
    if (createResult.error !== null) {
      setError(t.boards.submitError)
      return
    }

    setTitle('')
    setBody('')
    setAuthor('')
    setContact('')
    setFiles([])
    setAttachmentError(null)
    setSubmitSuccess(true)
    await loadPosts()
  }

  return (
    <ContactShell boardId={boardId}>
      <FeedbackBoardView
        boardId={boardId}
        copy={t.boards}
        optionalLabel={t.optional}
        authLoading={authLoading}
        configured={configured}
        user={user}
        posts={posts}
        loading={loading}
        error={error}
        title={title}
        body={body}
        author={author}
        contact={contact}
        files={files}
        attachmentError={attachmentError}
        submitSuccess={submitSuccess}
        submitBusy={submitBusy}
        allowsAttachments={allowsAttachments}
        onTitleChange={setTitle}
        onBodyChange={setBody}
        onAuthorChange={setAuthor}
        onContactChange={setContact}
        onAttachmentChange={handleAttachmentChange}
        onRemoveAttachment={removeAttachment}
        onSubmit={(event) => void handleSubmit(event)}
        onLoginClick={() => setAuthModalOpen(true)}
        onRetry={() => void loadPosts()}
      />
      {authModalOpen && (
        <Suspense fallback={null}>
          <AuthModal onClose={() => setAuthModalOpen(false)} />
        </Suspense>
      )}
    </ContactShell>
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
