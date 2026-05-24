import { useState } from 'react'
import type { FormEvent } from 'react'
import { findLobbyByCode, joinLobby } from '../lib/lobbiesApi'
import type { Lobby, LobbyPlayer } from '../lib/lobbiesApi'

type LobbyJoinDialogProps = {
  defaultUsername?: string
  onJoined: (result: { lobby: Lobby; player: LobbyPlayer }) => void
  onCancel: () => void
}

export function LobbyJoinDialog({ defaultUsername = '', onJoined, onCancel }: LobbyJoinDialogProps) {
  const [code, setCode] = useState('')
  const [username, setUsername] = useState(defaultUsername)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const cleanedCode = code.trim().toUpperCase()
    const cleanedName = username.trim()

    if (!cleanedCode) {
      setError('Lobby kodini kiriting')
      return
    }

    if (!cleanedName) {
      setError('Foydalanuvchi nomini kiriting')
      return
    }

    setBusy(true)
    setError(null)

    try {
      const lobby = await findLobbyByCode(cleanedCode)

      if (!lobby) {
        setError('Bunday kodli lobby topilmadi')
        setBusy(false)
        return
      }

      if (lobby.status === 'finished') {
        setError('Bu lobby allaqachon tugagan')
        setBusy(false)
        return
      }

      if (lobby.status === 'playing') {
        setError('Bu lobby allaqachon boshlangan')
        setBusy(false)
        return
      }

      const player = await joinLobby(lobby.id, cleanedName)
      onJoined({ lobby, player })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Qo'shilishda xatolik")
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Lobbyga qo'shilish</h2>

        <label className="editor-field">
          <span>Lobby kod</span>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            maxLength={8}
            placeholder="ABCD12"
            autoCapitalize="characters"
            autoFocus
          />
        </label>

        <label className="editor-field">
          <span>Sizning ismingiz</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={32}
            placeholder="Masalan: Ali"
          />
        </label>

        {error && <p className="my-quizzes-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="auth-button" onClick={onCancel} disabled={busy}>
            BEKOR
          </button>
          <button type="submit" className="auth-button auth-button--primary" disabled={busy}>
            {busy ? "TEKSHIRILMOQDA…" : "QO'SHILISH"}
          </button>
        </div>
      </form>
    </div>
  )
}
