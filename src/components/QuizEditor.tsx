import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { QuizDraft, QuizQuestion, UserQuiz } from '../lib/quizzesApi'
import { createQuiz, updateQuiz } from '../lib/quizzesApi'

type QuizEditorProps = {
  userId: string
  existing: UserQuiz | null
  onSaved: (quiz: UserQuiz) => void
  onCancel: () => void
}

const emptyQuestion = (): QuizQuestion => ({
  q: '',
  a: ['', '', '', ''],
  c: 0,
})

const initialDraft = (existing: UserQuiz | null): QuizDraft => {
  if (existing) {
    return {
      title: existing.title,
      description: existing.description,
      questions: existing.questions.length > 0 ? existing.questions : [emptyQuestion()],
    }
  }

  return {
    title: '',
    description: '',
    questions: [emptyQuestion()],
  }
}

export function QuizEditor({ userId, existing, onSaved, onCancel }: QuizEditorProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<QuizDraft>(() => initialDraft(existing))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateQuestion = (index: number, patch: Partial<QuizQuestion>) => {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, i) =>
        i === index ? { ...question, ...patch } : question,
      ),
    }))
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, i) =>
        i === questionIndex
          ? { ...question, a: question.a.map((option, j) => (j === optionIndex ? value : option)) }
          : question,
      ),
    }))
  }

  const addQuestion = () => {
    setDraft((current) => ({ ...current, questions: [...current.questions, emptyQuestion()] }))
  }

  const removeQuestion = (index: number) => {
    setDraft((current) => ({
      ...current,
      questions: current.questions.length > 1
        ? current.questions.filter((_, i) => i !== index)
        : current.questions,
    }))
  }

  const validate = (): string | null => {
    if (!draft.title.trim()) {
      return t('editor.titleRequired')
    }

    if (draft.questions.length === 0) {
      return t('editor.addOneQuestion')
    }

    for (let i = 0; i < draft.questions.length; i += 1) {
      const question = draft.questions[i]

      if (!question.q.trim()) {
        return t('editor.questionEmpty', { n: i + 1 })
      }

      if (question.a.some((option) => !option.trim())) {
        return t('editor.answersRequired', { n: i + 1 })
      }

      if (question.c < 0 || question.c > 3) {
        return t('editor.correctRequired', { n: i + 1 })
      }
    }

    return null
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validate()

    if (validationError) {
      setError(validationError)
      return
    }

    const payload: QuizDraft = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      questions: draft.questions.map((question) => ({
        q: question.q.trim(),
        a: question.a.map((option) => option.trim()),
        c: question.c,
      })),
    }

    setSaving(true)
    setError(null)

    try {
      const saved = existing
        ? await updateQuiz(existing.id, payload)
        : await createQuiz(userId, payload)
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('editor.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="quiz-editor" onSubmit={handleSubmit}>
      <div className="my-quizzes-head">
        <h1>{existing ? t('editor.editTitle') : t('editor.newTitle')}</h1>
        <button type="button" className="auth-button" onClick={onCancel} disabled={saving}>
          {t('editor.cancel')}
        </button>
      </div>

      <label className="editor-field">
        <span>{t('editor.titleLabel')}</span>
        <input
          type="text"
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          maxLength={120}
          placeholder={t('editor.titlePlaceholder')}
        />
      </label>

      <label className="editor-field">
        <span>{t('editor.descLabel')}</span>
        <textarea
          value={draft.description}
          onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          maxLength={400}
          placeholder={t('editor.descPlaceholder')}
          rows={2}
        />
      </label>

      <div className="editor-questions">
        {draft.questions.map((question, qIndex) => (
          <div key={qIndex} className="editor-question">
            <div className="editor-question-head">
              <strong>{t('editor.questionN', { n: qIndex + 1 })}</strong>
              <button
                type="button"
                className="auth-button auth-button--danger"
                onClick={() => removeQuestion(qIndex)}
                disabled={draft.questions.length === 1}
              >
                {t('editor.delete')}
              </button>
            </div>

            <label className="editor-field">
              <span>{t('editor.questionText')}</span>
              <input
                type="text"
                value={question.q}
                onChange={(event) => updateQuestion(qIndex, { q: event.target.value })}
                placeholder={t('editor.questionPlaceholder')}
              />
            </label>

            <div className="editor-options">
              {question.a.map((option, optIndex) => (
                <label key={optIndex} className={`editor-option${question.c === optIndex ? ' is-correct' : ''}`}>
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={question.c === optIndex}
                    onChange={() => updateQuestion(qIndex, { c: optIndex })}
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(event) => updateOption(qIndex, optIndex, event.target.value)}
                    placeholder={t('editor.answerPlaceholder', { n: optIndex + 1 })}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="auth-button" onClick={addQuestion}>
        {t('editor.addQuestion')}
      </button>

      {error && <p className="my-quizzes-error">{error}</p>}

      <div className="editor-actions">
        <button type="submit" className="auth-button auth-button--primary" disabled={saving}>
          {saving ? t('editor.saving') : t('editor.save')}
        </button>
      </div>
    </form>
  )
}
