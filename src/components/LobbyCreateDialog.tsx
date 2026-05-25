import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { QuizTopic } from '../lib/quizzesApi'
import { createLobby } from '../lib/lobbiesApi'
import type { Lobby, LobbyPlayer } from '../lib/lobbiesApi'

type LobbyCreateDialogProps = {
  hostId: string
  defaultUsername: string
  quiz: QuizTopic
  onCreated: (result: { lobby: Lobby; player: LobbyPlayer }) => void
  onCancel: () => void
}

export function LobbyCreateDialog({
  hostId,
  defaultUsername,
  quiz,
  onCreated,
  onCancel,
}: LobbyCreateDialogProps) {
  const { t } = useTranslation()
  const [username, setUsername] = useState(defaultUsername || 'Host')
  const [seconds, setSeconds] = useState(180)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const cleanedName = username.trim()

    if (!cleanedName) {
      setError(t('lobbyCreate.nameRequired'))
      return
    }

    if (quiz.questions.length === 0) {
      setError(t('lobbyCreate.noQuestions'))
      return
    }

    const cleanSeconds = Math.max(10, Math.min(3600, Math.round(seconds)))

    setBusy(true)
    setError(null)

    try {
      const result = await createLobby(hostId, quiz, cleanSeconds, cleanedName)
      onCreated(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('lobbyCreate.createError'))
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{t('lobbyCreate.title')}</h2>
        <p className="modal-sub">
          {t('lobbyCreate.test')}: <strong>{quiz.title}</strong> ({quiz.questions.length} {t('lobbyCreate.questions')})
        </p>

        <label className="editor-field">
          <span>{t('lobbyCreate.yourName')}</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={32}
            placeholder={t('lobbyCreate.namePlaceholder')}
          />
        </label>

        <label className="editor-field">
          <span>{t('lobbyCreate.timeLimit')}</span>
          <input
            type="number"
            min={10}
            max={3600}
            value={seconds}
            onChange={(event) => setSeconds(Number(event.target.value) || 0)}
          />
          <small className="modal-hint">{t('lobbyCreate.timeLimitHint')}</small>
        </label>

        {error && <p className="my-quizzes-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="auth-button" onClick={onCancel} disabled={busy}>
            {t('lobbyCreate.cancel')}
          </button>
          <button type="submit" className="auth-button auth-button--primary" disabled={busy}>
            {busy ? t('lobbyCreate.opening') : t('lobbyCreate.create')}
          </button>
        </div>
      </form>
    </div>
  )
}
