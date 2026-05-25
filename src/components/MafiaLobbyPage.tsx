import { useState } from 'react'
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
  const [mode, setMode] = useState<Mode>('idle')
  const [username, setUsername] = useState(defaultUsername)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const handleCreate = async () => {
    if (!hostId) return
    if (!username.trim()) { setErr('Ismingizni kiriting'); return }
    setBusy(true); setErr('')
    try {
      const result = await createMafiaLobby(hostId, username.trim())
      onCreated(result)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xatolik yuz berdi')
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async () => {
    if (!code.trim()) { setErr('Lobby kodini kiriting'); return }
    if (!username.trim()) { setErr('Ismingizni kiriting'); return }
    setBusy(true); setErr('')
    try {
      const lobby = await findMafiaLobbyByCode(code)
      if (!lobby) { setErr('Lobby topilmadi'); setBusy(false); return }
      if (lobby.status !== 'waiting') { setErr("O'yin allaqachon boshlangan"); setBusy(false); return }
      const player = await joinMafiaLobby(lobby.id, username.trim())
      onJoined({ lobby, player })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xatolik yuz berdi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mafia-lobby-page">
      <div className="mafia-lobby-page-header">
        {onBack && (
          <button type="button" className="mafia-back-link" onClick={onBack}>
            ← ORQAGA
          </button>
        )}
        <h1 className="mafia-title">MAFIA O'YINI</h1>
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
                + LOBBY OCHISH
              </button>
            ) : (
              <div className="mafia-anon-note">
                Lobby ochish uchun <strong>Google bilan kiring</strong>
              </div>
            )}
            <button
              type="button"
              className="mafia-btn"
              onClick={() => { setMode('joining'); setErr('') }}
            >
              LOBBYGA QO'SHILISH
            </button>
          </div>

          <div className="mafia-rules">
            <h2>QOIDALAR</h2>
            <ul>
              <li><span className="role-mafia">MAFIA</span> — har tunda bir fuqaroni o'ldiradi. Maqsad: mafia soni shahar soni bilan tenglashganda g'alaba.</li>
              <li><span className="role-citizen">FUQARO</span> — kunduz kuni mafiachini topib ovoz beradi. Maqsad: barcha mafiachini yo'q qilish.</li>
              <li><span className="role-doctor">DOKTOR</span> — har tunda bir kishini himoya qiladi (o'zini ham). Mafia nishon olgan kishi o'lmaydi.</li>
              <li><span className="role-sheriff">SHERIFF</span> — har tunda bir kishining mafia yoki yo'qligini aniqlaydi.</li>
            </ul>
            <div className="mafia-rules-flow">
              <div className="mafia-flow-step">TUN: Mafia o'ldiradi · Doktor himoya qiladi · Sheriff tekshiradi</div>
              <div className="mafia-flow-arrow">↓</div>
              <div className="mafia-flow-step">ERTA TONG: Kim o'lgani e'lon qilinadi</div>
              <div className="mafia-flow-arrow">↓</div>
              <div className="mafia-flow-step">MUHOKAMA: Barcha ovoz berib kimnidir chiqaradi</div>
              <div className="mafia-flow-arrow">↓</div>
              <div className="mafia-flow-step">G'OLIB: Barcha mafiachi yo'q qilinsa SHAHAR · Mafia tengdosh bo'lsa MAFIA yutadi</div>
            </div>
            <p className="mafia-rules-note">Minimum 4 o'yinchi · 4-5 kishi: 1 mafia · 6-8: 2 mafia · 9+: 3 mafia</p>
          </div>
        </>
      )}

      {mode === 'creating' && (
        <div className="mafia-form">
          <h2>LOBBY OCHISH</h2>
          <label className="mafia-label">
            Ismingiz
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
              {busy ? 'YARATILMOQDA…' : 'LOBBY OCHISH'}
            </button>
            <button type="button" className="mafia-btn" onClick={() => { setMode('idle'); setErr('') }}>
              ORQAGA
            </button>
          </div>
        </div>
      )}

      {mode === 'joining' && (
        <div className="mafia-form">
          <h2>LOBBYGA QO'SHILISH</h2>
          <label className="mafia-label">
            Lobby kodi
            <input
              className="mafia-input mafia-input--code"
              type="text"
              value={code}
              maxLength={6}
              placeholder="123456"
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
          </label>
          <label className="mafia-label">
            Ismingiz
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
              {busy ? 'QIDIRILMOQDA…' : "QO'SHILISH"}
            </button>
            <button type="button" className="mafia-btn" onClick={() => { setMode('idle'); setErr('') }}>
              ORQAGA
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
