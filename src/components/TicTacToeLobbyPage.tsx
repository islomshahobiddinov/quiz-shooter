import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TttLobby, TttPlayer } from '../lib/tictactoeApi'
import { createTttLobby, findTttLobbyByCode, joinTttLobby } from '../lib/tictactoeApi'
import type { BotDifficulty } from './TicTacToeBotGame'

type Props = {
  defaultUsername: string
  onCreated: (data: { lobby: TttLobby; player: TttPlayer }) => void
  onJoined: (data: { lobby: TttLobby; player: TttPlayer }) => void
  onBotGame: (data: { username: string; difficulty: BotDifficulty }) => void
}

type Mode = 'idle' | 'creating' | 'joining' | 'bot'

export function TicTacToeLobbyPage({ defaultUsername, onCreated, onJoined, onBotGame }: Props) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<Mode>('idle')
  const [username, setUsername] = useState(defaultUsername)
  const [code, setCode] = useState('')
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const handleCreate = async () => {
    if (!username.trim()) { setErr(t('ttt.nameRequired')); return }
    setBusy(true); setErr('')
    try {
      const result = await createTttLobby(username.trim())
      onCreated(result)
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('ttt.errorOccurred'))
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async () => {
    if (!code.trim()) { setErr(t('ttt.codeRequired')); return }
    if (!username.trim()) { setErr(t('ttt.nameRequired')); return }
    setBusy(true); setErr('')
    try {
      const lobby = await findTttLobbyByCode(code)
      if (!lobby) { setErr(t('ttt.lobbyNotFound')); setBusy(false); return }
      if (lobby.status !== 'waiting') { setErr(t('ttt.gameAlreadyStarted')); setBusy(false); return }
      const player = await joinTttLobby(lobby.id, username.trim())
      onJoined({ lobby: { ...lobby, status: 'playing' }, player })
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('ttt.errorOccurred'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ttt-lobby-page">
      <h1 className="ttt-page-title">{t('ttt.title')}</h1>

      {mode === 'idle' && (
        <>
          <div className="ttt-lobby-actions">
            <button
              type="button"
              className="ttt-btn ttt-btn--bot"
              onClick={() => { setMode('bot'); setErr('') }}
            >
              {t('ttt.playVsBot')}
            </button>
            <button
              type="button"
              className="ttt-btn ttt-btn--primary"
              onClick={() => { setMode('creating'); setErr('') }}
            >
              {t('ttt.createLobby')}
            </button>
            <button
              type="button"
              className="ttt-btn"
              onClick={() => { setMode('joining'); setErr('') }}
            >
              {t('ttt.joinLobby')}
            </button>
          </div>

          <div className="ttt-rules">
            <h2>{t('ttt.howToPlay')}</h2>
            <ul>
              <li>{t('ttt.rule1')}</li>
              <li>{t('ttt.rule2')}</li>
              <li>{t('ttt.rule3')}</li>
            </ul>
          </div>
        </>
      )}

      {mode === 'creating' && (
        <div className="ttt-form">
          <h2>{t('ttt.createFormTitle')}</h2>
          <label className="ttt-label">
            {t('ttt.yourName')}
            <input
              className="ttt-input"
              type="text"
              value={username}
              maxLength={24}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </label>
          {err && <p className="ttt-error">{err}</p>}
          <div className="ttt-form-actions">
            <button type="button" className="ttt-btn ttt-btn--primary" onClick={handleCreate} disabled={busy}>
              {busy ? t('ttt.creating') : t('ttt.createBtn')}
            </button>
            <button type="button" className="ttt-btn" onClick={() => { setMode('idle'); setErr('') }}>
              {t('ttt.backBtn')}
            </button>
          </div>
        </div>
      )}

      {mode === 'bot' && (
        <div className="ttt-form">
          <h2>{t('ttt.botFormTitle')}</h2>
          <label className="ttt-label">
            {t('ttt.yourName')}
            <input
              className="ttt-input"
              type="text"
              value={username}
              maxLength={24}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </label>
          <div className="ttt-label">
            {t('ttt.selectDifficulty')}
            <div className="ttt-diff-selector">
              {(['easy', 'medium', 'hard'] as BotDifficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`ttt-diff-btn${difficulty === d ? ' is-active' : ''} ttt-diff-btn--${d}`}
                  onClick={() => setDifficulty(d)}
                >
                  {t(`ttt.difficulty${d.charAt(0).toUpperCase() + d.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>
          {err && <p className="ttt-error">{err}</p>}
          <div className="ttt-form-actions">
            <button
              type="button"
              className="ttt-btn ttt-btn--bot"
              disabled={!username.trim()}
              onClick={() => {
                if (!username.trim()) { setErr(t('ttt.nameRequired')); return }
                onBotGame({ username: username.trim(), difficulty })
              }}
            >
              {t('ttt.startBtn')}
            </button>
            <button type="button" className="ttt-btn" onClick={() => { setMode('idle'); setErr('') }}>
              {t('ttt.backBtn')}
            </button>
          </div>
        </div>
      )}

      {mode === 'joining' && (
        <div className="ttt-form">
          <h2>{t('ttt.joinFormTitle')}</h2>
          <label className="ttt-label">
            {t('ttt.lobbyCode')}
            <input
              className="ttt-input ttt-input--code"
              type="text"
              value={code}
              maxLength={6}
              placeholder={t('ttt.codePlaceholder')}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
          </label>
          <label className="ttt-label">
            {t('ttt.yourName')}
            <input
              className="ttt-input"
              type="text"
              value={username}
              maxLength={24}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </label>
          {err && <p className="ttt-error">{err}</p>}
          <div className="ttt-form-actions">
            <button type="button" className="ttt-btn ttt-btn--primary" onClick={handleJoin} disabled={busy}>
              {busy ? t('ttt.searching') : t('ttt.joinBtn')}
            </button>
            <button type="button" className="ttt-btn" onClick={() => { setMode('idle'); setErr('') }}>
              {t('ttt.backBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
