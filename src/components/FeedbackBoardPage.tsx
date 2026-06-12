import { useState, type FormEvent } from 'react'
import type { BoardId } from '../config/boards'
import { addBoardPost, listBoardPosts, type BoardPost } from '../lib/feedbackBoardStorage'
import { useLanguage } from '../i18n'
import { ContactShell } from './ContactShell'

interface FeedbackBoardPageProps {
  boardId: BoardId
}

export function FeedbackBoardPage({ boardId }: FeedbackBoardPageProps) {
  const { t, locale } = useLanguage()
  const [posts, setPosts] = useState<BoardPost[]>(() => listBoardPosts(boardId))
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [author, setAuthor] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim() || !body.trim()) return
    addBoardPost(boardId, { title, body, author })
    setPosts(listBoardPosts(boardId))
    setTitle('')
    setBody('')
    setSubmitSuccess(true)
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
                    <time className="contact-post__time" dateTime={post.createdAt}>
                      {formatPostDate(post.createdAt, locale)}
                    </time>
                  </div>
                  <h4 className="contact-post__title">{post.title}</h4>
                  <p className="contact-post__body">{post.body}</p>
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
