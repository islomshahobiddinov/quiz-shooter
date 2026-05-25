import { useEffect, useRef, useState } from 'react'
import type { LastEvent, MafiaLobby, MafiaPlayer, MafiaRole } from '../lib/mafiaApi'
import {
  castVote,
  checkAllNightActionsReady,
  checkWinner,
  resolveNight,
  resolveVote,
  startDayVote,
  startMafiaGame,
  submitNightAction,
  subscribeToMafiaLobby,
  subscribeToMafiaPlayers,
} from '../lib/mafiaApi'

type Props = {
  lobby: MafiaLobby
  player: MafiaPlayer
  onExit: () => void
}

const ROLE_LABELS: Record<MafiaRole, string> = {
  mafia: 'MAFIA',
  citizen: 'FUQARO',
  doctor: 'DOKTOR',
  sheriff: 'SHERIFF',
}

const ROLE_CLASSES: Record<MafiaRole, string> = {
  mafia: 'role-mafia',
  citizen: 'role-citizen',
  doctor: 'role-doctor',
  sheriff: 'role-sheriff',
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {})
}

export function MafiaGame({ lobby: initialLobby, player: myPlayer, onExit }: Props) {
  const [lobby, setLobby] = useState(initialLobby)
  const [players, setPlayers] = useState<MafiaPlayer[]>([])
  const [nightActionDone, setNightActionDone] = useState(false)
  const [myVote, setMyVote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const isHost = myPlayer.is_host
  const nightResolvedRef = useRef(false)
  const voteResolvedRef = useRef(false)
  const lobbyRef = useRef(lobby)
  const playersRef = useRef(players)
  lobbyRef.current = lobby
  playersRef.current = players

  useEffect(() => {
    const unsubLobby = subscribeToMafiaLobby(lobby.id, setLobby)
    const unsubPlayers = subscribeToMafiaPlayers(lobby.id, setPlayers)
    return () => { unsubLobby(); unsubPlayers() }
  }, [lobby.id])

  // Reset per-round flags on phase change
  useEffect(() => {
    if (lobby.phase === 'night') {
      setNightActionDone(false)
      setMyVote(null)
      nightResolvedRef.current = false
    }
    if (lobby.phase === 'day_vote') {
      setMyVote(null)
      voteResolvedRef.current = false
    }
    setErr('')
  }, [lobby.phase, lobby.round])

  // Host: auto-resolve night when all actions submitted
  useEffect(() => {
    if (!isHost || lobby.phase !== 'night' || nightResolvedRef.current) return
    const currentPlayers = playersRef.current
    if (!currentPlayers.length) return
    const ready = checkAllNightActionsReady(currentPlayers, lobby.roles, lobby.night_actions)
    if (ready) {
      nightResolvedRef.current = true
      resolveNight(lobby.id, currentPlayers, lobby.roles, lobby.night_actions).catch((e) => {
        console.error(e)
        nightResolvedRef.current = false
      })
    }
  }, [lobby.night_actions, lobby.phase, lobby.roles, isHost, lobby.id])

  const me = players.find((p) => p.id === myPlayer.id)
  const myRole = lobby.roles[myPlayer.id] ?? null
  const alivePlayers = players.filter((p) => p.is_alive)
  const aliveCount = alivePlayers.length

  const voteCount = Object.keys(lobby.day_votes ?? {}).length
  const allVoted = voteCount >= aliveCount && aliveCount > 0

  const handleStart = async () => {
    if (players.length < 4) { setErr("Kamida 4 o'yinchi kerak"); return }
    setBusy(true); setErr('')
    try { await startMafiaGame(lobby.id, players) }
    catch (e) { setErr(e instanceof Error ? e.message : 'Xatolik') }
    finally { setBusy(false) }
  }

  const handleNightAction = async (targetId: string) => {
    if (!myRole || nightActionDone) return
    if (myRole === 'citizen') return
    setBusy(true); setErr('')
    try {
      await submitNightAction(lobby.id, myRole, targetId)
      setNightActionDone(true)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Xatolik') }
    finally { setBusy(false) }
  }

  const handleStartDayVote = async () => {
    setBusy(true); setErr('')
    try { await startDayVote(lobby.id) }
    catch (e) { setErr(e instanceof Error ? e.message : 'Xatolik') }
    finally { setBusy(false) }
  }

  const handleVote = async (targetId: string) => {
    if (myVote || !me?.is_alive) return
    setBusy(true); setErr('')
    try {
      await castVote(lobby.id, myPlayer.id, targetId)
      setMyVote(targetId)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Xatolik') }
    finally { setBusy(false) }
  }

  const handleResolveVote = async () => {
    if (voteResolvedRef.current) return
    voteResolvedRef.current = true
    setBusy(true); setErr('')
    try {
      await resolveVote(lobby.id, players, lobby.roles, lobby.day_votes ?? {}, lobby.round)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xatolik')
      voteResolvedRef.current = false
    } finally { setBusy(false) }
  }

  const getTally = () => {
    const tally: Record<string, number> = {}
    for (const targetId of Object.values(lobby.day_votes ?? {})) {
      tally[targetId] = (tally[targetId] ?? 0) + 1
    }
    return tally
  }

  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.username ?? id

  // ── WAITING ROOM ────────────────────────────────────────────
  if (lobby.status === 'waiting') {
    return (
      <div className="mafia-game">
        <div className="mafia-game-inner">
          <div className="mafia-code-block">
            <span className="mafia-code-label">LOBBY KODI</span>
            <span className="mafia-code-big">{lobby.code}</span>
            <button type="button" className="mafia-copy-btn" onClick={() => copyToClipboard(lobby.code)}>
              NUSXA
            </button>
          </div>

          <p className="mafia-section-title">O'YINCHILAR ({players.length})</p>
          <ul className="mafia-player-list">
            {players.map((p) => (
              <li key={p.id} className={p.id === myPlayer.id ? 'is-me' : ''}>
                {p.username} {p.is_host && <em>★ HOST</em>}
              </li>
            ))}
            {players.length === 0 && <li className="lobby-empty">Hech kim yo'q</li>}
          </ul>

          {err && <p className="mafia-error">{err}</p>}

          {isHost ? (
            <button
              type="button"
              className="mafia-btn mafia-btn--primary mafia-start-btn"
              onClick={handleStart}
              disabled={busy || players.length < 4}
            >
              {busy ? 'BOSHLANMOQDA…' : `▶ O'YINNI BOSHLASH (min 4)`}
            </button>
          ) : (
            <p className="mafia-waiting">Host o'yinni boshlaguncha kuting…</p>
          )}

          <button type="button" className="mafia-exit-btn" onClick={onExit}>CHIQISH</button>
        </div>
      </div>
    )
  }

  // ── GAME OVER ────────────────────────────────────────────────
  if (lobby.status === 'finished') {
    const isMafiaWin = lobby.winner === 'mafia'
    return (
      <div className="mafia-game mafia-game--over">
        <div className="mafia-game-inner">
          <h1 className={`mafia-winner-title ${isMafiaWin ? 'mafia-winner--red' : 'mafia-winner--cyan'}`}>
            {isMafiaWin ? '🔴 MAFIA G\'ALABA QOZONDI' : '🏆 SHAHAR G\'ALABA QOZONDI'}
          </h1>

          <p className="mafia-section-title">BARCHA ROLLAR</p>
          <ul className="mafia-player-list mafia-player-list--roles">
            {players.map((p) => {
              const role = lobby.roles[p.id] as MafiaRole | undefined
              return (
                <li key={p.id} className={p.id === myPlayer.id ? 'is-me' : ''}>
                  <span className={role ? ROLE_CLASSES[role] : ''}>
                    {role ? ROLE_LABELS[role] : '?'}
                  </span>
                  {' — '}
                  {p.username}
                  {!p.is_alive && <em> (halok)</em>}
                  {p.id === myPlayer.id && <em> (siz)</em>}
                </li>
              )
            })}
          </ul>

          <button type="button" className="mafia-btn mafia-btn--primary" onClick={onExit}>
            BOSH SAHIFAGA
          </button>
        </div>
      </div>
    )
  }

  // ── PLAYING ──────────────────────────────────────────────────
  const lastEvent = lobby.last_event as LastEvent | null

  // NIGHT PHASE
  if (lobby.phase === 'night') {
    const nonMafiaAlive = alivePlayers.filter((p) => lobby.roles[p.id] !== 'mafia')
    const mafiaTeam = alivePlayers.filter((p) => lobby.roles[p.id] === 'mafia')

    return (
      <div className="mafia-game mafia-game--night">
        <div className="mafia-game-inner">
          <div className="mafia-phase-header">
            <span className="mafia-phase-label">TUN</span>
            <span className="mafia-round-label">AYLANA {lobby.round}</span>
          </div>

          {myRole && (
            <div className={`mafia-my-role ${ROLE_CLASSES[myRole]}`}>
              SIZNING ROLINGIZ: <strong>{ROLE_LABELS[myRole]}</strong>
            </div>
          )}

          {myRole === 'mafia' && (
            <>
              {mafiaTeam.length > 1 && (
                <p className="mafia-team-info">
                  Mafia jamoasi: {mafiaTeam.filter(p => p.id !== myPlayer.id).map(p => p.username).join(', ')}
                </p>
              )}
              {nightActionDone ? (
                <p className="mafia-done-msg">✓ Nishon tanlandi. Boshqalar kutilmoqda…</p>
              ) : (
                <>
                  <p className="mafia-action-prompt">Kim ni o'ldirish kerak?</p>
                  <ul className="mafia-target-list">
                    {nonMafiaAlive.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          className="mafia-target-btn mafia-target-btn--kill"
                          onClick={() => handleNightAction(p.id)}
                          disabled={busy}
                        >
                          {p.username}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          {myRole === 'doctor' && (
            nightActionDone ? (
              <p className="mafia-done-msg">✓ Himoyalandi. Boshqalar kutilmoqda…</p>
            ) : (
              <>
                <p className="mafia-action-prompt">Kimni himoya qilasiz?</p>
                <ul className="mafia-target-list">
                  {alivePlayers.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="mafia-target-btn mafia-target-btn--save"
                        onClick={() => handleNightAction(p.id)}
                        disabled={busy}
                      >
                        {p.username} {p.id === myPlayer.id ? '(siz)' : ''}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )
          )}

          {myRole === 'sheriff' && (
            nightActionDone ? (
              <>
                <p className="mafia-done-msg">✓ Tekshirildi. Natija erta tong ko'rinadi.</p>
              </>
            ) : (
              <>
                <p className="mafia-action-prompt">Kimni tekshirmoqchisiz?</p>
                <ul className="mafia-target-list">
                  {alivePlayers.filter(p => p.id !== myPlayer.id).map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="mafia-target-btn mafia-target-btn--check"
                        onClick={() => handleNightAction(p.id)}
                        disabled={busy}
                      >
                        {p.username}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )
          )}

          {myRole === 'citizen' && (
            <div className="mafia-sleep">
              <p>😴 Uxlayapsiz…</p>
              <p className="mafia-sleep-sub">Mafia ish boshladi. Erta tong kuting.</p>
            </div>
          )}

          {err && <p className="mafia-error">{err}</p>}
        </div>
      </div>
    )
  }

  // DAY REVEAL PHASE
  if (lobby.phase === 'day_reveal') {
    const killedName = lastEvent?.killed ? getPlayerName(lastEvent.killed) : null
    const sheriffResult = myRole === 'sheriff' && lastEvent?.sheriffTarget
      ? { name: getPlayerName(lastEvent.sheriffTarget), isMafia: lastEvent.sheriffIsMafia }
      : null

    return (
      <div className="mafia-game mafia-game--reveal">
        <div className="mafia-game-inner">
          <div className="mafia-phase-header">
            <span className="mafia-phase-label">ERTA TONG</span>
            <span className="mafia-round-label">AYLANA {lobby.round}</span>
          </div>

          <div className="mafia-reveal-box">
            {killedName ? (
              <>
                <p className="mafia-reveal-killed">💀 {killedName} halok bo'ldi</p>
                <p className="mafia-reveal-sub">Kecha tunda {killedName} o'ldirildi.</p>
              </>
            ) : (
              <>
                <p className="mafia-reveal-safe">✨ Hech kim halok bo'lmadi</p>
                <p className="mafia-reveal-sub">Doktor barini qutqardi yoki mafia nishon almadi.</p>
              </>
            )}
          </div>

          {sheriffResult && (
            <div className={`mafia-sheriff-result ${sheriffResult.isMafia ? 'is-mafia' : 'is-innocent'}`}>
              Sheriff natijasi: <strong>{sheriffResult.name}</strong> —{' '}
              {sheriffResult.isMafia ? '🔴 MAFIA!' : '✅ BEGUNOH'}
            </div>
          )}

          {err && <p className="mafia-error">{err}</p>}

          {isHost ? (
            <button
              type="button"
              className="mafia-btn mafia-btn--primary"
              onClick={handleStartDayVote}
              disabled={busy}
            >
              MUHOKAMAGA O'TISH →
            </button>
          ) : (
            <p className="mafia-waiting">Host muhokamani boshlaguncha kuting…</p>
          )}
        </div>
      </div>
    )
  }

  // DAY VOTE PHASE
  if (lobby.phase === 'day_vote') {
    const tally = getTally()
    const amAlive = me?.is_alive ?? false

    return (
      <div className="mafia-game mafia-game--vote">
        <div className="mafia-game-inner">
          <div className="mafia-phase-header">
            <span className="mafia-phase-label">MUHOKAMA</span>
            <span className="mafia-round-label">AYLANA {lobby.round}</span>
          </div>

          <p className="mafia-action-prompt">
            {amAlive
              ? myVote
                ? `✓ Ovoz berdingiz: ${getPlayerName(myVote)}`
                : 'Kim chiqib ketishi kerak? Ovoz bering:'
              : 'Siz halok bo\'ldingiz. Kuzatmoqdasiz.'}
          </p>

          <ul className="mafia-target-list">
            {alivePlayers.map((p) => {
              const votes = tally[p.id] ?? 0
              const isTarget = myVote === p.id
              const isSelf = p.id === myPlayer.id
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`mafia-target-btn mafia-target-btn--vote${isTarget ? ' is-selected' : ''}`}
                    onClick={() => !isSelf && handleVote(p.id)}
                    disabled={busy || !!myVote || !amAlive || isSelf}
                  >
                    {p.username} {isSelf && '(siz)'}
                    {votes > 0 && <span className="mafia-vote-count">{votes} ovoz</span>}
                  </button>
                </li>
              )
            })}
          </ul>

          <p className="mafia-vote-progress">
            Ovoz berganlar: {voteCount} / {aliveCount}
          </p>

          {err && <p className="mafia-error">{err}</p>}

          {isHost && (
            <button
              type="button"
              className="mafia-btn mafia-btn--primary"
              onClick={handleResolveVote}
              disabled={busy || !allVoted}
            >
              {allVoted ? 'OVOZLARNI YAKUNLASH →' : `Kutilmoqda… (${voteCount}/${aliveCount})`}
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}
