import { useState } from 'react'
import type { FormEvent } from 'react'
import type { UserQuiz } from '../lib/quizzesApi'
import { createLobby } from '../lib/lobbiesApi'
import type { Lobby, LobbyPlayer } from '../lib/lobbiesApi'

type LobbyCreateDialogProps = {
  hostId: string
  defaultUsername: string
  quiz: UserQuiz
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
  const [username, setUsername] = useState(defaultUsername || 'Host')
  const [seconds, setSeconds] = useState(180)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const cleanedName = username.trim()

    if (!cleanedName) {
      setError('Foydalanuvchi nomini kiriting')
      return
    }

    if (quiz.questions.length === 0) {
      setError('Bu testda savollar yoʻq')
      return
    }

    const cleanSeconds = Math.max(10, Math.min(3600, Math.round(seconds)))

    setBusy(true)
    setError(null)

    try {
      const result = await createLobby(hostId, quiz, cleanSeconds, cleanedName)
      onCreated(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yaratishda xatolik')
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Lobby ochish</h2>
        <p className="modal-sub">Test: <strong>{quiz.title}</strong> ({quiz.questions.length} ta savol)</p>

        <label className="editor-field">
          <span>Sizning ismingiz (host)</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={32}
            placeholder="Masalan: Aliyev"
          />
        </label>

        <label className="editor-field">
          <span>Vaqt chegarasi (sekund)</span>
          <input
            type="number"
            min={10}
            max={3600}
            value={seconds}
            onChange={(event) => setSeconds(Number(event.target.value) || 0)}
          />
          <small className="modal-hint">10–3600 sekund. Masalan 180 = 3 daqiqa.</small>
        </label>

        {error && <p className="my-quizzes-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="auth-button" onClick={onCancel} disabled={busy}>
            BEKOR
          </button>
          <button type="submit" className="auth-button auth-button--primary" disabled={busy}>
            {busy ? "OCHILMOQDA…" : "LOBBY OCHISH"}
          </button>
        </div>
      </form>
    </div>
  )
}
