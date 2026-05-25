import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { UserQuiz } from '../lib/quizzesApi'
import { deleteQuiz, listMyQuizzes } from '../lib/quizzesApi'

type MyQuizzesProps = {
  onPlay: (quiz: UserQuiz) => void
  onEdit: (quiz: UserQuiz) => void
  onCreate: () => void
  onOpenLobby: (quiz: UserQuiz) => void
  refreshKey: number
}

export function MyQuizzes({ onPlay, onEdit, onCreate, onOpenLobby, refreshKey }: MyQuizzesProps) {
  const { t } = useTranslation()
  const [quizzes, setQuizzes] = useState<UserQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    listMyQuizzes()
      .then((data) => {
        if (!cancelled) {
          setQuizzes(data)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('myQuizzes.loadingError'))
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (quiz: UserQuiz) => {
    if (!window.confirm(t('myQuizzes.confirmDelete', { title: quiz.title }))) {
      return
    }

    setDeletingId(quiz.id)

    try {
      await deleteQuiz(quiz.id)
      setQuizzes((current) => current.filter((item) => item.id !== quiz.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('myQuizzes.deleteError'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="my-quizzes">
      <div className="my-quizzes-head">
        <h1>{t('myQuizzes.title')}</h1>
        <button type="button" className="auth-button auth-button--primary" onClick={onCreate}>
          {t('myQuizzes.newTest')}
        </button>
      </div>

      {loading && <p className="my-quizzes-status">{t('myQuizzes.loading')}</p>}
      {error && <p className="my-quizzes-error">{error}</p>}

      {!loading && !error && quizzes.length === 0 && (
        <p className="my-quizzes-status">{t('myQuizzes.empty')}</p>
      )}

      <div className="topic-grid">
        {quizzes.map((quiz) => (
          <article key={quiz.id} className="topic-card topic-card--mine">
            <span>{quiz.title}</span>
            <small>{quiz.description || ' '}</small>
            <strong>{quiz.questions.length} {t('myQuizzes.questions')}</strong>
            <div className="quiz-card-actions">
              <button
                type="button"
                className="auth-button auth-button--primary"
                onClick={() => onPlay(quiz)}
                disabled={quiz.questions.length === 0}
              >
                {t('myQuizzes.play')}
              </button>
              <button
                type="button"
                className="auth-button"
                onClick={() => onOpenLobby(quiz)}
                disabled={quiz.questions.length === 0}
              >
                {t('myQuizzes.lobby')}
              </button>
              <button type="button" className="auth-button" onClick={() => onEdit(quiz)}>
                {t('myQuizzes.edit')}
              </button>
              <button
                type="button"
                className="auth-button auth-button--danger"
                onClick={() => handleDelete(quiz)}
                disabled={deletingId === quiz.id}
              >
                {deletingId === quiz.id ? t('myQuizzes.deleting') : t('myQuizzes.delete')}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
