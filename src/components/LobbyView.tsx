import { useEffect, useMemo, useRef, useState } from 'react'
import { ShooterCanvas } from './ShooterCanvas'
import type { ShooterFinished, ShooterProgress } from './ShooterCanvas'
import type { Lobby, LobbyPlayer } from '../lib/lobbiesApi'
import {
  finishLobby,
  getLobby,
  leaveLobby,
  startLobby,
  subscribeToLobby,
  subscribeToPlayers,
  updatePlayerProgress,
} from '../lib/lobbiesApi'

type LobbyViewProps = {
  lobby: Lobby
  player: LobbyPlayer
  soundEnabled: boolean
  onSoundToggle: () => void
  onExit: () => void
}

export function LobbyView({ lobby: initialLobby, player, soundEnabled, onSoundToggle, onExit }: LobbyViewProps) {
  const [lobby, setLobby] = useState<Lobby>(initialLobby)
  const [players, setPlayers] = useState<LobbyPlayer[]>([])
  const [remaining, setRemaining] = useState(initialLobby.time_limit_seconds)
  const [resetSignal, setResetSignal] = useState(0)
  const [endSignal, setEndSignal] = useState(0)
  const startedRef = useRef(false)
  const [hud, setHud] = useState<ShooterProgress>({
    question: initialLobby.quiz_questions[0]?.q ?? '',
    questionNumber: 1,
    score: 0,
    lives: 3,
  })
  const [localFinished, setLocalFinished] = useState<ShooterFinished | null>(null)
  const finishedRef = useRef(false)
  const isHost = player.is_host

  // Subscribe to lobby updates
  useEffect(() => {
    const stop = subscribeToLobby(lobby.id, (next) => {
      setLobby(next)
    })

    // Initial refresh in case state changed between createLobby and subscription
    getLobby(lobby.id).then((fresh) => {
      if (fresh) setLobby(fresh)
    })

    return stop
  }, [lobby.id])

  // Subscribe to players list
  useEffect(() => subscribeToPlayers(lobby.id, setPlayers), [lobby.id])

  // Countdown timer (driven by started_at on the lobby row, so everyone is in sync)
  useEffect(() => {
    if (lobby.status !== 'playing' || !lobby.started_at) {
      setRemaining(lobby.time_limit_seconds)
      return
    }

    const startMs = new Date(lobby.started_at).getTime()
    const totalMs = lobby.time_limit_seconds * 1000

    const tick = () => {
      const left = Math.max(0, Math.ceil((startMs + totalMs - Date.now()) / 1000))
      setRemaining(left)

      if (left <= 0 && !finishedRef.current) {
        finishedRef.current = true
        setEndSignal((s) => s + 1)
      }
    }

    tick()
    const interval = window.setInterval(tick, 250)
    return () => window.clearInterval(interval)
  }, [lobby.status, lobby.started_at, lobby.time_limit_seconds])

  // When the lobby flips to playing, kick off the shooter
  useEffect(() => {
    if (lobby.status === 'playing' && !startedRef.current) {
      startedRef.current = true
      setLocalFinished(null)
      finishedRef.current = false
      setHud({
        question: lobby.quiz_questions[0]?.q ?? '',
        questionNumber: 1,
        score: 0,
        lives: 3,
      })
      setResetSignal((s) => s + 1)
    }
  }, [lobby.status, lobby.quiz_questions])

  // When the lobby finishes, force-end gameplay if still active
  useEffect(() => {
    if (lobby.status === 'finished' && !finishedRef.current) {
      finishedRef.current = true
      setEndSignal((s) => s + 1)
    }
  }, [lobby.status])

  // Host: when all players are finished, mark lobby finished
  useEffect(() => {
    if (!isHost || lobby.status !== 'playing' || players.length === 0) return
    if (players.every((p) => p.finished)) {
      finishLobby(lobby.id).catch((err) => console.error('finishLobby error', err))
    }
  }, [isHost, lobby.id, lobby.status, players])

  const handleProgress = (state: ShooterProgress) => {
    setHud(state)
    updatePlayerProgress(player.id, {
      score: state.score,
      lives: state.lives,
      question_index: state.questionNumber - 1,
    }).catch((err) => console.error('updatePlayerProgress error', err))
  }

  const handleFinished = (info: ShooterFinished) => {
    setLocalFinished(info)
    updatePlayerProgress(player.id, {
      score: info.score,
      finished: true,
    }).catch((err) => console.error('updatePlayerProgress error', err))
  }

  const handleStart = async () => {
    try {
      await startLobby(lobby.id)
    } catch (err) {
      console.error('startLobby error', err)
    }
  }

  const handleExit = async () => {
    try {
      await leaveLobby(player.id)
    } catch (err) {
      console.error('leaveLobby error', err)
    }
    onExit()
  }

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => b.score - a.score || a.joined_at.localeCompare(b.joined_at)),
    [players],
  )

  const livesText = `${'♥'.repeat(Math.max(0, hud.lives))}${'♡'.repeat(Math.max(0, 3 - hud.lives))}`
  const isPlaying = lobby.status === 'playing'
  const isFinished = lobby.status === 'finished'
  const totalQuestions = lobby.quiz_questions.length

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <main className={`edu-mars${isPlaying ? ' is-playing' : ''}`}>
      {isPlaying && (
        <div className="hud">
          <div className="score-bar">
            <span className="lobby-code-chip">KOD: {lobby.code}</span>
            <span>
              TO'G'RI: <span>{hud.score}</span>
            </span>
            <span>
              SAVOL: <span>{hud.questionNumber}</span>/{totalQuestions}
            </span>
            <span className="lives">{livesText}</span>
            <span className={`lobby-timer${remaining <= 10 ? ' is-urgent' : ''}`}>⏱ {timeStr}</span>
            <button
              type="button"
              className="sound-toggle"
              onClick={onSoundToggle}
            >
              OVOZ: {soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="question-box">
            <div className="question-text">{hud.question}</div>
          </div>
        </div>
      )}

      <ShooterCanvas
        questions={lobby.quiz_questions}
        soundEnabled={soundEnabled}
        active={isPlaying && !localFinished}
        resetSignal={resetSignal}
        endSignal={endSignal}
        onProgress={handleProgress}
        onFinished={handleFinished}
      />

      {isPlaying && (
        <aside className="live-leaderboard">
          <h3>JONLI REYTING</h3>
          <ol>
            {sortedPlayers.map((p) => (
              <li key={p.id} className={p.id === player.id ? 'is-me' : ''}>
                <span className="lb-name">
                  {p.username}
                  {p.is_host && <em> ★</em>}
                  {p.finished && <em> ✓</em>}
                </span>
                <span className="lb-score">{p.score}</span>
              </li>
            ))}
          </ol>
        </aside>
      )}

      {!isPlaying && !isFinished && (
        <section className="topic-menu is-visible">
          <div className="topic-menu-inner lobby-room">
            <div className="my-quizzes-head">
              <h1>{isHost ? 'Lobby tayyor' : 'Lobby kutilmoqda'}</h1>
              <button type="button" className="auth-button" onClick={handleExit}>
                CHIQISH
              </button>
            </div>

            <div className="lobby-code-block">
              <span className="lobby-code-label">KOD</span>
              <span className="lobby-code-big">{lobby.code}</span>
              <button
                type="button"
                className="auth-button"
                onClick={() => {
                  navigator.clipboard?.writeText(lobby.code).catch(() => undefined)
                }}
              >
                NUSXALASH
              </button>
            </div>

            <p className="lobby-meta">
              Test: <strong>{lobby.quiz_title}</strong> · {totalQuestions} ta savol · vaqt:{' '}
              <strong>{lobby.time_limit_seconds}s</strong>
            </p>

            <h3 className="lobby-section-title">O'yinchilar ({players.length})</h3>
            <ul className="lobby-player-list">
              {players.map((p) => (
                <li key={p.id}>
                  <span>
                    {p.username}
                    {p.is_host && <em> ★ host</em>}
                    {p.id === player.id && <em> (siz)</em>}
                  </span>
                </li>
              ))}
              {players.length === 0 && <li className="lobby-empty">Hali hech kim qo'shilmadi…</li>}
            </ul>

            {isHost ? (
              <button
                type="button"
                className="auth-button auth-button--primary lobby-start"
                onClick={handleStart}
                disabled={players.length === 0}
              >
                ▶ BOSHLASH
              </button>
            ) : (
              <p className="lobby-waiting">Host boshlashini kuting…</p>
            )}
          </div>
        </section>
      )}

      {(isFinished || (isPlaying && localFinished)) && (
        <div className="overlay is-visible">
          <h2>
            {isFinished ? 'YAKUNIY REYTING' : localFinished?.won ? 'TUGADI! 🏆' : "VAQT TUGADI"}
          </h2>
          <ol className="final-leaderboard">
            {sortedPlayers.map((p, index) => (
              <li key={p.id} className={p.id === player.id ? 'is-me' : ''}>
                <span className="lb-rank">{index + 1}.</span>
                <span className="lb-name">
                  {p.username}
                  {p.is_host && <em> ★</em>}
                </span>
                <span className="lb-score">{p.score}</span>
              </li>
            ))}
          </ol>
          <div className="overlay-actions">
            {isHost && !isFinished && (
              <button
                type="button"
                onClick={() => {
                  finishLobby(lobby.id).catch((err) => console.error(err))
                }}
              >
                LOBBYNI YOPISH
              </button>
            )}
            <button type="button" onClick={handleExit}>
              CHIQISH
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
