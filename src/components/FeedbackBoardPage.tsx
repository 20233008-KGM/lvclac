import { useState, type FormEvent } from 'react'
import type { BoardId } from '../config/boards'
import { useNavigate } from '../hooks/usePathname'
import { addBoardPost, listBoardPosts, type BoardPost } from '../lib/feedbackBoardStorage'
import { useLanguage } from '../i18n'
import { LanguageToggle } from './LanguageToggle'
import { PageShell } from './PageShell'
import { SiteFooter } from './SiteFooter'

interface FeedbackBoardPageProps {
  boardId: BoardId
}

export function FeedbackBoardPage({ boardId }: FeedbackBoardPageProps) {
  const { t, locale } = useLanguage()
  const navigate = useNavigate()
  const board = t.boards.items[boardId]
  const [posts, setPosts] = useState<BoardPost[]>(() => listBoardPosts(boardId))
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [author, setAuthor] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim() || !body.trim()) return
    addBoardPost(boardId, { title, body, author })
    setPosts(listBoardPosts(boardId))
    setTitle('')
    setBody('')
  }

  return (
    <PageShell>
      <div className="board-page">
        <header className="board-page__header">
          <div className="board-page__header-main">
            <button type="button" className="link-btn board-page__back" onClick={() => navigate('/')}>
              {t.boards.backToCalculator}
            </button>
            <h1 className="board-page__title">{board.title}</h1>
            <p className="board-page__desc">{board.description}</p>
          </div>
          <LanguageToggle variant="header" />
        </header>

        <p className="board-page__notice">{t.boards.storageNotice}</p>

        <section className="board-panel" aria-labelledby={`board-form-${boardId}`}>
          <h2 id={`board-form-${boardId}`} className="board-panel__title">
            {t.boards.writePost}
          </h2>
          <form className="board-form" onSubmit={handleSubmit}>
            <label className="board-form__field">
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
            <label className="board-form__field">
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
            <label className="board-form__field">
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
            <button type="submit" className="btn btn-primary board-form__submit">
              {t.boards.submit}
            </button>
          </form>
        </section>

        <section className="board-panel" aria-labelledby={`board-list-${boardId}`}>
          <h2 id={`board-list-${boardId}`} className="board-panel__title">
            {t.boards.postList}
          </h2>
          {posts.length === 0 ? (
            <p className="board-empty">{t.boards.empty}</p>
          ) : (
            <ul className="board-list">
              {posts.map((post) => (
                <li key={post.id} className="board-post">
                  <div className="board-post__meta">
                    <span className="board-post__author">
                      {post.author || t.boards.anonymous}
                    </span>
                    <time className="board-post__time" dateTime={post.createdAt}>
                      {formatPostDate(post.createdAt, locale)}
                    </time>
                  </div>
                  <h3 className="board-post__title">{post.title}</h3>
                  <p className="board-post__body">{post.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <SiteFooter />
    </PageShell>
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
