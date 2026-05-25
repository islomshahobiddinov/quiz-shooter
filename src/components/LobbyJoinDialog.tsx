import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { findLobbyByCode, joinLobby } from '../lib/lobbiesApi'
import type { Lobby, LobbyPlayer } from '../lib/lobbiesApi'

type LobbyJoinDialogProps = {
  defaultUsername?: string
  onJoined: (result: { lobby: Lobby; player: LobbyPlayer }) => void
  onCancel: () => void
}

export function LobbyJoinDialog({ defaultUsername = '', onJoined, onCancel }: LobbyJoinDialogProps) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [username, setUsername] = useState(defaultUsername)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const cleanedCode = code.trim()
    const cleanedName = username.trim()

    if (!/^\d{6}$/.test(cleanedCode)) {
      setError(t('lobbyJoin.codeRequired'))
      return
    }

    if (!cleanedName) {
      setError(t('lobbyJoin.nameRequired'))
      return
    }

    setBusy(true)
    setError(null)

    try {
      const lobby = await findLobbyByCode(cleanedCode)

      if (!lobby) {
        setError(t('lobbyJoin.notFound'))
        setBusy(false)
        return
      }

      if (lobby.status === 'finished') {
        setError(t('lobbyJoin.finished'))
        setBusy(false)
        return
      }

      if (lobby.status === 'playing') {
        setError(t('lobbyJoin.started'))
        setBusy(false)
        return
      }

      const player = await joinLobby(lobby.id, cleanedName)
      onJoined({ lobby, player })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('lobbyJoin.joinError'))
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{t('lobbyJoin.title')}</h2>

        <label className="editor-field">
          <span>{t('lobbyJoin.code')}</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            placeholder={t('lobbyJoin.codePlaceholder')}
            autoFocus
          />
        </label>

        <label className="editor-field">
          <span>{t('lobbyJoin.yourName')}</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={32}
            placeholder={t('lobbyJoin.namePlaceholder')}
          />
        </label>

        {error && <p className="my-quizzes-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="auth-button" onClick={onCancel} disabled={busy}>
            {t('lobbyJoin.cancel')}
          </button>
          <button type="submit" className="auth-button auth-button--primary" disabled={busy}>
            {busy ? t('lobbyJoin.checking') : t('lobbyJoin.join')}
          </button>
        </div>
      </form>
    </div>
  )
}
