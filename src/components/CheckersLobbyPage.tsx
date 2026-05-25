import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CheckersLobby, CheckersPlayer } from '../lib/checkersApi'
import { createCheckersLobby, findCheckersLobbyByCode, joinCheckersLobby } from '../lib/checkersApi'
import type { CheckersDifficulty } from '../lib/checkersLogic'

type Props = {
  defaultUsername: string
  onCreated: (data: { lobby: CheckersLobby; player: CheckersPlayer }) => void
  onJoined:  (data: { lobby: CheckersLobby; player: CheckersPlayer }) => void
  onBotGame: (data: { username: string; difficulty: CheckersDifficulty }) => void
}

type Mode = 'idle' | 'creating' | 'joining' | 'bot'

export function CheckersLobbyPage({ defaultUsername, onCreated, onJoined, onBotGame }: Props) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<Mode>('idle')
  const [username, setUsername] = useState(defaultUsername)
  const [code, setCode] = useState('')
  const [difficulty, setDifficulty] = useState<CheckersDifficulty>('medium')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const go = (m: Mode) => { setMode(m); setErr('') }

  const handleCreate = async () => {
    if (!username.trim()) { setErr(t('checkers.nameRequired')); return }
    setBusy(true); setErr('')
    try { onCreated(await createCheckersLobby(username.trim())) }
    catch (e) { setErr(e instanceof Error ? e.message : t('checkers.errorOccurred')) }
    finally { setBusy(false) }
  }

  const handleJoin = async () => {
    if (!code.trim())     { setErr(t('checkers.codeRequired')); return }
    if (!username.trim()) { setErr(t('checkers.nameRequired')); return }
    setBusy(true); setErr('')
    try {
      const lobby = await findCheckersLobbyByCode(code)
      if (!lobby)                   { setErr(t('checkers.lobbyNotFound')); setBusy(false); return }
      if (lobby.status !== 'waiting') { setErr(t('checkers.gameAlreadyStarted')); setBusy(false); return }
      const player = await joinCheckersLobby(lobby.id, username.trim())
      onJoined({ lobby: { ...lobby, status: 'playing' }, player })
    } catch (e) { setErr(e instanceof Error ? e.message : t('checkers.errorOccurred')) }
    finally { setBusy(false) }
  }

  return (
    <div className="checkers-lobby-page">
      <h1 className="checkers-page-title">{t('checkers.title')}</h1>

      {mode === 'idle' && (
        <>
          <div className="checkers-lobby-actions">
            <button type="button" className="checkers-btn checkers-btn--bot" onClick={() => go('bot')}>
              {t('checkers.playVsBot')}
            </button>
            <button type="button" className="checkers-btn checkers-btn--primary" onClick={() => go('creating')}>
              {t('checkers.createLobby')}
            </button>
            <button type="button" className="checkers-btn" onClick={() => go('joining')}>
              {t('checkers.joinLobby')}
            </button>
          </div>

          <div className="checkers-rules">
            <h2>{t('checkers.howToPlay')}</h2>
            <ul>
              <li>{t('checkers.rule1')}</li>
              <li>{t('checkers.rule2')}</li>
              <li>{t('checkers.rule3')}</li>
              <li>{t('checkers.rule4')}</li>
            </ul>
          </div>
        </>
      )}

      {mode === 'bot' && (
        <div className="checkers-form">
          <h2>{t('checkers.botFormTitle')}</h2>
          <label className="checkers-label">
            {t('checkers.yourName')}
            <input
              className="checkers-input"
              type="text"
              value={username}
              maxLength={24}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
          </label>
          <div className="checkers-label">
            {t('checkers.selectDifficulty')}
            <div className="checkers-diff-selector">
              {(['easy', 'medium', 'hard'] as CheckersDifficulty[]).map(d => (
                <button
                  key={d}
                  type="button"
                  className={`checkers-diff-btn${difficulty === d ? ' is-active' : ''} checkers-diff-btn--${d}`}
                  onClick={() => setDifficulty(d)}
                >
                  {t(`checkers.difficulty${d.charAt(0).toUpperCase() + d.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>
          {err && <p className="checkers-error">{err}</p>}
          <div className="checkers-form-actions">
            <button
              type="button"
              className="checkers-btn checkers-btn--bot"
              disabled={!username.trim()}
              onClick={() => {
                if (!username.trim()) { setErr(t('checkers.nameRequired')); return }
                onBotGame({ username: username.trim(), difficulty })
              }}
            >
              {t('checkers.startBtn')}
            </button>
            <button type="button" className="checkers-btn" onClick={() => go('idle')}>
              {t('checkers.backBtn')}
            </button>
          </div>
        </div>
      )}

      {mode === 'creating' && (
        <div className="checkers-form">
          <h2>{t('checkers.createFormTitle')}</h2>
          <label className="checkers-label">
            {t('checkers.yourName')}
            <input
              className="checkers-input"
              type="text"
              value={username}
              maxLength={24}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </label>
          {err && <p className="checkers-error">{err}</p>}
          <div className="checkers-form-actions">
            <button type="button" className="checkers-btn checkers-btn--primary" onClick={handleCreate} disabled={busy}>
              {busy ? t('checkers.creating') : t('checkers.createBtn')}
            </button>
            <button type="button" className="checkers-btn" onClick={() => go('idle')}>
              {t('checkers.backBtn')}
            </button>
          </div>
        </div>
      )}

      {mode === 'joining' && (
        <div className="checkers-form">
          <h2>{t('checkers.joinFormTitle')}</h2>
          <label className="checkers-label">
            {t('checkers.lobbyCode')}
            <input
              className="checkers-input checkers-input--code"
              type="text"
              value={code}
              maxLength={6}
              placeholder={t('checkers.codePlaceholder')}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
          </label>
          <label className="checkers-label">
            {t('checkers.yourName')}
            <input
              className="checkers-input"
              type="text"
              value={username}
              maxLength={24}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
          </label>
          {err && <p className="checkers-error">{err}</p>}
          <div className="checkers-form-actions">
            <button type="button" className="checkers-btn checkers-btn--primary" onClick={handleJoin} disabled={busy}>
              {busy ? t('checkers.searching') : t('checkers.joinBtn')}
            </button>
            <button type="button" className="checkers-btn" onClick={() => go('idle')}>
              {t('checkers.backBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
