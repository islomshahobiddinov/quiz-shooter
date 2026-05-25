import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MafiaLobby, MafiaPlayer } from '../lib/mafiaApi'
import { createMafiaLobby, findMafiaLobbyByCode, joinMafiaLobby } from '../lib/mafiaApi'

type Props = {
  hostId: string | null
  defaultUsername: string
  onCreated: (data: { lobby: MafiaLobby; player: MafiaPlayer }) => void
  onJoined: (data: { lobby: MafiaLobby; player: MafiaPlayer }) => void
  onBack?: () => void
}

type Mode = 'idle' | 'creating' | 'joining'

export function MafiaLobbyPage({ hostId, defaultUsername, onCreated, onJoined, onBack }: Props) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<Mode>('idle')
  const [username, setUsername] = useState(defaultUsername)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const handleCreate = async () => {
    if (!hostId) return
    if (!username.trim()) { setErr(t('mafiaLobby.nameRequired')); return }
    setBusy(true); setErr('')
    try {
      const result = await createMafiaLobby(hostId, username.trim())
      onCreated(result)
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('mafiaLobby.errorOccurred'))
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async () => {
    if (!code.trim()) { setErr(t('mafiaLobby.codeRequired')); return }
    if (!username.trim()) { setErr(t('mafiaLobby.nameRequired')); return }
    setBusy(true); setErr('')
    try {
      const lobby = await findMafiaLobbyByCode(code)
      if (!lobby) { setErr(t('mafiaLobby.lobbyNotFound')); setBusy(false); return }
      if (lobby.status !== 'waiting') { setErr(t('mafiaLobby.gameStarted')); setBusy(false); return }
      const player = await joinMafiaLobby(lobby.id, username.trim())
      onJoined({ lobby, player })
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('mafiaLobby.errorOccurred'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mafia-lobby-page">
      <div className="mafia-lobby-page-header">
        {onBack && (
          <button type="button" className="mafia-back-link" onClick={onBack}>
            {t('mafiaLobby.back')}
          </button>
        )}
        <h1 className="mafia-title">{t('mafiaLobby.title')}</h1>
      </div>

      {mode === 'idle' && (
        <>
          <div className="mafia-lobby-actions">
            {hostId ? (
              <button
                type="button"
                className="mafia-btn mafia-btn--primary"
                onClick={() => { setMode('creating'); setErr('') }}
              >
                {t('mafiaLobby.createLobby')}
              </button>
            ) : (
              <div className="mafia-anon-note">
                {t('mafiaLobby.signInPrefix')} <strong>{t('mafiaLobby.signInHighlight')}</strong>
              </div>
            )}
            <button
              type="button"
              className="mafia-btn"
              onClick={() => { setMode('joining'); setErr('') }}
            >
              {t('mafiaLobby.joinLobby')}
            </button>
          </div>

          <div className="mafia-rules">
            <h2>{t('mafiaLobby.rules')}</h2>
            <ul>
              <li><span className="role-mafia">{t('roles.mafia')}</span> — {t('mafiaLobby.ruleMafiaDesc')}</li>
              <li><span className="role-citizen">{t('roles.citizen')}</span> — {t('mafiaLobby.ruleCitizenDesc')}</li>
              <li><span className="role-doctor">{t('roles.doctor')}</span> — {t('mafiaLobby.ruleDoctorDesc')}</li>
              <li><span className="role-sheriff">{t('roles.sheriff')}</span> — {t('mafiaLobby.ruleSheriffDesc')}</li>
            </ul>
            <div className="mafia-rules-flow">
              <div className="mafia-flow-step">{t('mafiaLobby.flowNight')}</div>
              <div className="mafia-flow-arrow">↓</div>
              <div className="mafia-flow-step">{t('mafiaLobby.flowDawn')}</div>
              <div className="mafia-flow-arrow">↓</div>
              <div className="mafia-flow-step">{t('mafiaLobby.flowDiscussion')}</div>
              <div className="mafia-flow-arrow">↓</div>
              <div className="mafia-flow-step">{t('mafiaLobby.flowWinner')}</div>
            </div>
            <p className="mafia-rules-note">{t('mafiaLobby.minPlayers')}</p>
          </div>
        </>
      )}

      {mode === 'creating' && (
        <div className="mafia-form">
          <h2>{t('mafiaLobby.createFormTitle')}</h2>
          <label className="mafia-label">
            {t('mafiaLobby.yourName')}
            <input
              className="mafia-input"
              type="text"
              value={username}
              maxLength={24}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </label>
          {err && <p className="mafia-error">{err}</p>}
          <div className="mafia-form-actions">
            <button type="button" className="mafia-btn mafia-btn--primary" onClick={handleCreate} disabled={busy}>
              {busy ? t('mafiaLobby.creating') : t('mafiaLobby.createBtn')}
            </button>
            <button type="button" className="mafia-btn" onClick={() => { setMode('idle'); setErr('') }}>
              {t('mafiaLobby.backBtn')}
            </button>
          </div>
        </div>
      )}

      {mode === 'joining' && (
        <div className="mafia-form">
          <h2>{t('mafiaLobby.joinFormTitle')}</h2>
          <label className="mafia-label">
            {t('mafiaLobby.lobbyCode')}
            <input
              className="mafia-input mafia-input--code"
              type="text"
              value={code}
              maxLength={6}
              placeholder={t('mafiaLobby.codePlaceholder')}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
          </label>
          <label className="mafia-label">
            {t('mafiaLobby.yourName')}
            <input
              className="mafia-input"
              type="text"
              value={username}
              maxLength={24}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </label>
          {err && <p className="mafia-error">{err}</p>}
          <div className="mafia-form-actions">
            <button type="button" className="mafia-btn mafia-btn--primary" onClick={handleJoin} disabled={busy}>
              {busy ? t('mafiaLobby.searching') : t('mafiaLobby.joinBtn')}
            </button>
            <button type="button" className="mafia-btn" onClick={() => { setMode('idle'); setErr('') }}>
              {t('mafiaLobby.backBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
