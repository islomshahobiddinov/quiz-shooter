import { useEffect, useState } from 'react'
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
          setError(err instanceof Error ? err.message : 'Yuklashda xatolik')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const handleDelete = async (quiz: UserQuiz) => {
    if (!window.confirm(`"${quiz.title}" testini o'chirishni tasdiqlaysizmi?`)) {
      return
    }

    setDeletingId(quiz.id)

    try {
      await deleteQuiz(quiz.id)
      setQuizzes((current) => current.filter((item) => item.id !== quiz.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "O'chirishda xatolik")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="my-quizzes">
      <div className="my-quizzes-head">
        <h1>Mening testlarim</h1>
        <button type="button" className="auth-button auth-button--primary" onClick={onCreate}>
          + YANGI TEST
        </button>
      </div>

      {loading && <p className="my-quizzes-status">Yuklanmoqda…</p>}
      {error && <p className="my-quizzes-error">{error}</p>}

      {!loading && !error && quizzes.length === 0 && (
        <p className="my-quizzes-status">Hali test yaratmagansiz. "+ YANGI TEST" tugmasini bosing.</p>
      )}

      <div className="topic-grid">
        {quizzes.map((quiz) => (
          <article key={quiz.id} className="topic-card topic-card--mine">
            <span>{quiz.title}</span>
            <small>{quiz.description || ' '}</small>
            <strong>{quiz.questions.length} ta savol</strong>
            <div className="quiz-card-actions">
              <button
                type="button"
                className="auth-button auth-button--primary"
                onClick={() => onPlay(quiz)}
                disabled={quiz.questions.length === 0}
              >
                ▶ O'YNASH
              </button>
              <button
                type="button"
                className="auth-button"
                onClick={() => onOpenLobby(quiz)}
                disabled={quiz.questions.length === 0}
              >
                + LOBBY
              </button>
              <button type="button" className="auth-button" onClick={() => onEdit(quiz)}>
                TAHRIRLASH
              </button>
              <button
                type="button"
                className="auth-button auth-button--danger"
                onClick={() => handleDelete(quiz)}
                disabled={deletingId === quiz.id}
              >
                {deletingId === quiz.id ? "O'CHIRILMOQDA…" : "O'CHIRISH"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
