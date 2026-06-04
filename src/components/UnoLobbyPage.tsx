import { useState } from 'react'
import {
  createUnoLobby, findUnoLobbyByCode, joinUnoLobby,
  startUnoGame, subscribeToUnoPlayers,
} from '../lib/unoApi'
import type { UnoLobby, UnoPlayer } from '../lib/unoApi'
import { useEffect } from 'react'

type Mode = 'idle' | 'creating' | 'joining' | 'waiting'

type Props = {
  playerId: string
  defaultUsername: string
  onStarted: (lobby: UnoLobby, player: UnoPlayer) => void
}

export function UnoLobbyPage({ playerId, defaultUsername, onStarted }: Props) {
  const [mode, setMode] = useState<Mode>('idle')
  const [username, setUsername] = useState(defaultUsername)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [lobby, setLobby] = useState<UnoLobby | null>(null)
  const [player, setPlayer] = useState<UnoPlayer | null>(null)
  const [players, setPlayers] = useState<UnoPlayer[]>([])

  useEffect(() => {
    if (!lobby) return
    const unsub = subscribeToUnoPlayers(lobby.id, setPlayers)
    return unsub
  }, [lobby?.id])

  const handleCreate = async () => {
    if (!username.trim()) { setErr('Ism kiriting'); return }
    setBusy(true); setErr('')
    try {
      const { lobby: l, player: p } = await createUnoLobby(playerId, username.trim())
      setLobby(l); setPlayer(p); setMode('waiting')
    } catch (e) { setErr(e instanceof Error ? e.message : 'Xatolik') }
    finally { setBusy(false) }
  }

  const handleJoin = async () => {
    if (!code.trim()) { setErr('Kod kiriting'); return }
    if (!username.trim()) { setErr('Ism kiriting'); return }
    setBusy(true); setErr('')
    try {
      const found = await findUnoLobbyByCode(code)
      if (!found) { setErr('Lobby topilmadi'); setBusy(false); return }
      if (found.status !== 'waiting') { setErr('O\'yin boshlangan'); setBusy(false); return }
      const p = await joinUnoLobby(found.id, playerId, username.trim())
      setLobby(found); setPlayer(p); setMode('waiting')
    } catch (e) { setErr(e instanceof Error ? e.message : 'Xatolik') }
    finally { setBusy(false) }
  }

  const handleStart = async () => {
    if (!lobby || players.length < 2) return
    setBusy(true); setErr('')
    try {
      await startUnoGame(lobby.id)
      onStarted(lobby, player!)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Xatolik') }
    finally { setBusy(false) }
  }

  // ── Waiting room ──────────────────────────────────────────────
  if (mode === 'waiting' && lobby && player) {
    return (
      <div className="uno-lobby-page">
        <h1 className="uno-lobby-title">UNO — Kutish xonasi</h1>

        <div className="uno-code-box">
          <span className="uno-code-label">Lobby kodi</span>
          <span className="uno-code-value">{lobby.code}</span>
          <small className="uno-code-hint">Ushbu kodni do'stlaringizga yuboring</small>
        </div>

        <div className="uno-players-list">
          <h3 className="uno-players-title">O'yinchilar ({players.length}/4)</h3>
          {players.map(p => (
            <div key={p.id} className={`uno-player-row${p.player_id === playerId ? ' is-me' : ''}`}>
              <span className="uno-player-seat">#{p.seat + 1}</span>
              <span className="uno-player-name">{p.username}</span>
              {p.player_id === lobby.host_id && <span className="uno-host-badge">HOST</span>}
              {p.player_id === playerId && <span className="uno-me-badge">Sen</span>}
            </div>
          ))}
        </div>

        {err && <p className="mafia-error">{err}</p>}

        {player.player_id === lobby.host_id ? (
          <button
            type="button"
            className="mafia-btn mafia-btn--primary"
            onClick={handleStart}
            disabled={busy || players.length < 2}
          >
            {players.length < 2 ? 'Kamida 2 kishi kerak' : busy ? 'Boshlanmoqda...' : 'O\'yinni boshlash'}
          </button>
        ) : (
          <p className="uno-waiting-text">Host o'yinni boshlashini kuting...</p>
        )}
      </div>
    )
  }

  // ── Idle ─────────────────────────────────────────────────────
  if (mode === 'idle') {
    return (
      <div className="uno-lobby-page">
        <h1 className="uno-lobby-title">UNO</h1>
        <p className="uno-lobby-subtitle">2–4 o'yinchi bilan real vaqtli UNO o'yini</p>
        <div className="uno-lobby-actions">
          <button type="button" className="mafia-btn mafia-btn--primary" onClick={() => setMode('creating')}>
            Lobby yaratish
          </button>
          <button type="button" className="mafia-btn" onClick={() => setMode('joining')}>
            Lobby ga qo'shilish
          </button>
        </div>
        <div className="uno-rules">
          <h2>Qoidalar</h2>
          <ul>
            <li>Har bir o'yinchi 7 ta karta oladi</li>
            <li>Navbatda rangi yoki raqami mos karta tashlash mumkin</li>
            <li><span className="uno-rule-card" style={{background:'#dc2626'}}>Skip</span> — navbatni o'tkazib yuboradi</li>
            <li><span className="uno-rule-card" style={{background:'#2563eb'}}>↺</span> — yo'nalishni o'zgartiradi</li>
            <li><span className="uno-rule-card" style={{background:'#16a34a'}}>+2</span> — keyingi o'yinchi 2 karta oladi</li>
            <li><span className="uno-rule-card" style={{background:'#4c1d95'}}>W / +4</span> — ixtiyoriy rang tanlash</li>
            <li>Birinchi kartasiz qolgan o'yinchi g'alaba qozonadi</li>
          </ul>
        </div>
      </div>
    )
  }

  // ── Create form ───────────────────────────────────────────────
  if (mode === 'creating') {
    return (
      <div className="uno-lobby-page">
        <h2 className="uno-lobby-title">Lobby yaratish</h2>
        <label className="mafia-label">
          Ismingiz
          <input
            className="mafia-input" type="text" value={username} maxLength={20} autoFocus
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
        </label>
        {err && <p className="mafia-error">{err}</p>}
        <div className="mafia-form-actions">
          <button type="button" className="mafia-btn mafia-btn--primary" onClick={handleCreate} disabled={busy}>
            {busy ? 'Yaratilmoqda...' : 'Yaratish'}
          </button>
          <button type="button" className="mafia-btn" onClick={() => { setMode('idle'); setErr('') }}>
            Orqaga
          </button>
        </div>
      </div>
    )
  }

  // ── Join form ─────────────────────────────────────────────────
  return (
    <div className="uno-lobby-page">
      <h2 className="uno-lobby-title">Lobby ga qo'shilish</h2>
      <label className="mafia-label">
        Lobby kodi
        <input
          className="mafia-input mafia-input--code" type="text" value={code} maxLength={6}
          placeholder="123456" inputMode="numeric" autoFocus
          onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
        />
      </label>
      <label className="mafia-label">
        Ismingiz
        <input
          className="mafia-input" type="text" value={username} maxLength={20}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
        />
      </label>
      {err && <p className="mafia-error">{err}</p>}
      <div className="mafia-form-actions">
        <button type="button" className="mafia-btn mafia-btn--primary" onClick={handleJoin} disabled={busy}>
          {busy ? 'Qidirilmoqda...' : "Qo'shilish"}
        </button>
        <button type="button" className="mafia-btn" onClick={() => { setMode('idle'); setErr('') }}>
          Orqaga
        </button>
      </div>
    </div>
  )
}
