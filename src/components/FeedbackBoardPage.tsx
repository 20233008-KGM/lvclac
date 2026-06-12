import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import type { BoardId } from '../config/boards'
import {
  MAX_BOARD_ATTACHMENTS,
  readImageAttachment,
  type AttachmentError,
} from '../lib/feedbackBoardImage'
import {
  addBoardPost,
  listBoardPosts,
  type BoardPost,
  type BoardPostAttachment,
} from '../lib/feedbackBoardStorage'
import { useLanguage } from '../i18n'
import { ContactShell } from './ContactShell'

interface FeedbackBoardPageProps {
  boardId: BoardId
}

export function FeedbackBoardPage({ boardId }: FeedbackBoardPageProps) {
  const { t, locale } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [posts, setPosts] = useState<BoardPost[]>(() => listBoardPosts(boardId))
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [author, setAuthor] = useState('')
  const [contact, setContact] = useState('')
  const [attachments, setAttachments] = useState<BoardPostAttachment[]>([])
  const [attachmentError, setAttachmentError] = useState<AttachmentError | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const allowsAttachments = boardId === 'bugs'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim() || !body.trim()) return
    addBoardPost(boardId, {
      title,
      body,
      author,
      contact,
      attachments: allowsAttachments ? attachments : undefined,
    })
    setPosts(listBoardPosts(boardId))
    setTitle('')
    setBody('')
    setAuthor('')
    setContact('')
    setAttachments([])
    setAttachmentError(null)
    setSubmitSuccess(true)
  }

  async function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files?.length) return

    setAttachmentError(null)
    const next = [...attachments]

    for (const file of Array.from(files)) {
      if (next.length >= MAX_BOARD_ATTACHMENTS) {
        setAttachmentError('too_many')
        break
      }

      const result = await readImageAttachment(file)
      if (!result.ok) {
        setAttachmentError(result.error)
        continue
      }
      next.push(result.attachment)
    }

    setAttachments(next)
    event.target.value = ''
  }

  function removeAttachment(index: number) {
    setAttachments((current) => current.filter((_, i) => i !== index))
    setAttachmentError(null)
  }

  function attachmentErrorMessage(error: AttachmentError): string {
    switch (error) {
      case 'invalid_type':
        return t.boards.attachmentInvalidType
      case 'too_large':
        return t.boards.attachmentTooLarge
      case 'too_many':
        return t.boards.attachmentTooMany
    }
  }

  return (
    <ContactShell boardId={boardId}>
      <div className="contact-main">
        <p className="contact-main__notice">{t.boards.storageNotice}</p>

        <section className="contact-panel" aria-labelledby={`board-form-${boardId}`}>
          <h3 id={`board-form-${boardId}`} className="contact-panel__title">
            {t.boards.writePost}
          </h3>
          <form className="contact-form" onSubmit={handleSubmit}>
            <label className="contact-form__field">
              <span>{t.boards.postTitle}</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.boards.postTitlePlaceholder}
                required
                maxLength={120}
              />
            </label>
            <label className="contact-form__field">
              <span>{t.boards.postBody}</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t.boards.postBodyPlaceholder}
                required
                rows={5}
                maxLength={4000}
              />
            </label>
            <label className="contact-form__field">
              <span>
                {t.boards.postAuthor} {t.optional}
              </span>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder={t.boards.postAuthorPlaceholder}
                maxLength={40}
              />
            </label>
            <label className="contact-form__field">
              <span>
                {t.boards.postContact} {t.optional}
              </span>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={t.boards.postContactPlaceholder}
                maxLength={120}
                autoComplete="email"
              />
            </label>
            {allowsAttachments && (
              <div className="contact-form__field">
                <span>
                  {t.boards.postAttachments} {t.optional}
                </span>
                <p className="contact-form__hint">{t.boards.postAttachmentsHint}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  multiple
                  className="contact-form__file-input"
                  onChange={handleAttachmentChange}
                />
                <button
                  type="button"
                  className="contact-form__attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachments.length >= MAX_BOARD_ATTACHMENTS}
                >
                  {t.boards.addAttachment}
                </button>
                {attachmentError && (
                  <p className="contact-form__error" role="alert">
                    {attachmentErrorMessage(attachmentError)}
                  </p>
                )}
                {attachments.length > 0 && (
                  <ul className="contact-attachments" aria-label={t.boards.postAttachments}>
                    {attachments.map((attachment, index) => (
                      <li key={`${attachment.name}-${index}`} className="contact-attachment">
                        <img
                          src={attachment.dataUrl}
                          alt={attachment.name}
                          className="contact-attachment__preview"
                        />
                        <div className="contact-attachment__meta">
                          <span className="contact-attachment__name">{attachment.name}</span>
                          <button
                            type="button"
                            className="contact-attachment__remove"
                            onClick={() => removeAttachment(index)}
                          >
                            {t.boards.removeAttachment}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <button type="submit" className="contact-form__submit">
              {t.boards.submit}
            </button>
            {submitSuccess && (
              <p className="contact-form__success" role="status">
                {t.boards.submitSuccess}
              </p>
            )}
          </form>
        </section>

        {posts.length > 0 && (
          <section className="contact-panel" aria-labelledby={`board-list-${boardId}`}>
            <h3 id={`board-list-${boardId}`} className="contact-panel__title">
              {t.boards.postList}
            </h3>
            <p className="contact-panel__desc">{t.boards.localPostListDesc}</p>
            <ul className="contact-list">
              {posts.map((post) => (
                <li key={post.id} className="contact-post">
                  <div className="contact-post__meta">
                    <span className="contact-post__author">
                      {post.author || t.boards.anonymous}
                    </span>
                    {post.contact && (
                      <span className="contact-post__contact">{post.contact}</span>
                    )}
                    <time className="contact-post__time" dateTime={post.createdAt}>
                      {formatPostDate(post.createdAt, locale)}
                    </time>
                  </div>
                  <h4 className="contact-post__title">{post.title}</h4>
                  <p className="contact-post__body">{post.body}</p>
                  {post.attachments && post.attachments.length > 0 && (
                    <ul className="contact-post__attachments" aria-label={t.boards.postAttachments}>
                      {post.attachments.map((attachment, index) => (
                        <li key={`${post.id}-attachment-${index}`}>
                          <a
                            href={attachment.dataUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="contact-post__attachment-link"
                          >
                            <img
                              src={attachment.dataUrl}
                              alt={attachment.name}
                              className="contact-post__attachment-img"
                            />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </ContactShell>
  )
}

function formatPostDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
