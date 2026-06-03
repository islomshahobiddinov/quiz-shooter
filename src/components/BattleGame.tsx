import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShooterCanvas } from './ShooterCanvas'
import type { ShooterFinished, ShooterProgress } from './ShooterCanvas'
import { BattleArena } from './BattleArena'
import type { BattleLobby, BattlePlayer, BattleWinner } from '../lib/battleApi'
import {
  finishBattleLobby,
  getBattleLobby,
  leaveBattleLobby,
  scoreTeam,
  startBattleLobby,
  subscribeToBattleLobby,
  subscribeToBattlePlayers,
  updateBattlePlayerProgress,
} from '../lib/battleApi'

type Props = {
  lobby: BattleLobby
  player: BattlePlayer
  soundEnabled: boolean
  onSoundToggle: () => void
  onExit: () => void
}

export function BattleGame({
  lobby: initialLobby,
  player,
  soundEnabled,
  onSoundToggle,
  onExit,
}: Props) {
  const { t } = useTranslation()
  const [lobby, setLobby] = useState<BattleLobby>(initialLobby)
  const [players, setPlayers] = useState<BattlePlayer[]>([])
  const [remaining, setRemaining] = useState(initialLobby.time_limit_seconds)
  const [resetSignal, setResetSignal] = useState(0)
  const [endSignal, setEndSignal] = useState(0)
  const [hud, setHud] = useState<ShooterProgress>({
    question: initialLobby.quiz_questions[0]?.q ?? '',
    questionNumber: 1,
    score: 0,
    lives: 3,
  })
  const [localFinished, setLocalFinished] = useState<ShooterFinished | null>(null)
  const finishedRef = useRef(false)
  const startedRef = useRef(false)
  const isHost = player.is_host

  // Subscribe to lobby updates
  useEffect(() => {
    const stop = subscribeToBattleLobby(lobby.id, (next) => setLobby(next))
    getBattleLobby(lobby.id).then((fresh) => { if (fresh) setLobby(fresh) })
    return stop
  }, [lobby.id])

  // Subscribe to players
  useEffect(() => subscribeToBattlePlayers(lobby.id, setPlayers), [lobby.id])

  // Countdown timer (synced to started_at)
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
        if (isHost) {
          const winner: BattleWinner =
            lobby.team_a_score > lobby.team_b_score
              ? 'a'
              : lobby.team_b_score > lobby.team_a_score
                ? 'b'
                : 'draw'
          finishBattleLobby(lobby.id, winner).catch((err) =>
            console.error('finishBattleLobby error', err),
          )
        }
      }
    }
    tick()
    const interval = window.setInterval(tick, 250)
    return () => window.clearInterval(interval)
  }, [lobby.status, lobby.started_at, lobby.time_limit_seconds, isHost, lobby.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Start shooter when lobby flips to playing
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

  // Force-end if lobby finishes externally
  useEffect(() => {
    if (lobby.status === 'finished' && !finishedRef.current) {
      finishedRef.current = true
      setEndSignal((s) => s + 1)
    }
  }, [lobby.status])

  // Host: rope win condition
  useEffect(() => {
    if (!isHost || lobby.status !== 'playing' || finishedRef.current) return
    if (lobby.rope_position <= 10) {
      finishedRef.current = true
      finishBattleLobby(lobby.id, 'a').catch((err) => console.error('finishBattleLobby error', err))
    } else if (lobby.rope_position >= 90) {
      finishedRef.current = true
      finishBattleLobby(lobby.id, 'b').catch((err) => console.error('finishBattleLobby error', err))
    }
  }, [isHost, lobby.id, lobby.status, lobby.rope_position])

  // Host: all players finished
  useEffect(() => {
    if (!isHost || lobby.status !== 'playing' || players.length === 0) return
    if (players.every((p) => p.finished) && !finishedRef.current) {
      finishedRef.current = true
      const aScore = players.filter((p) => p.team === 'a').reduce((s, p) => s + p.score, 0)
      const bScore = players.filter((p) => p.team === 'b').reduce((s, p) => s + p.score, 0)
      const winner: BattleWinner = aScore > bScore ? 'a' : bScore > aScore ? 'b' : 'draw'
      finishBattleLobby(lobby.id, winner).catch((err) => console.error('finishBattleLobby error', err))
    }
  }, [isHost, lobby.id, lobby.status, players])

  const handleProgress = (state: ShooterProgress) => {
    setHud(state)
    updateBattlePlayerProgress(player.id, {
      score: state.score,
      lives: state.lives,
      question_index: state.questionNumber - 1,
    }).catch((err) => console.error('updateBattlePlayerProgress error', err))
  }

  const handleAnswer = (correct: boolean) => {
    if (correct) {
      scoreTeam(lobby.id, player.team).catch((err) =>
        console.error('scoreTeam error', err),
      )
    }
  }

  const handleFinished = (info: ShooterFinished) => {
    setLocalFinished(info)
    updateBattlePlayerProgress(player.id, {
      score: info.score,
      finished: true,
    }).catch((err) => console.error('updateBattlePlayerProgress error', err))
  }

  const handleStart = async () => {
    try {
      await startBattleLobby(lobby.id)
    } catch (err) {
      console.error('startBattleLobby error', err)
    }
  }

  const handleExit = async () => {
    try {
      await leaveBattleLobby(player.id)
    } catch (err) {
      console.error('leaveBattleLobby error', err)
    }
    onExit()
  }

  const teamAPlayers = useMemo(() => players.filter((p) => p.team === 'a'), [players])
  const teamBPlayers = useMemo(() => players.filter((p) => p.team === 'b'), [players])

  const isPlaying = lobby.status === 'playing'
  const isFinished = lobby.status === 'finished'
  const totalQuestions = lobby.quiz_questions.length
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`
  const livesText = `${'♥'.repeat(Math.max(0, hud.lives))}${'♡'.repeat(Math.max(0, 3 - hud.lives))}`

  // Team names for arena
  const teamAName = teamAPlayers[0]?.username ?? 'JAMOA A'
  const teamBName = teamBPlayers[0]?.username ?? 'JAMOA B'
  const myTeamBadge = player.team === 'a' ? '🔴 A' : '🔵 B'

  return (
    <main className={`edu-mars${isPlaying ? ' is-playing' : ''}`}>
      {/* HUD */}
      {isPlaying && (
        <div className="hud">
          <div className="score-bar">
            <span className="lobby-code-chip">{lobby.code}</span>
            <span className="battle-team-badge battle-team-badge--me">{myTeamBadge}</span>
            <span>
              {t('battle.correct')}: <span>{hud.score}</span>
            </span>
            <span>
              {t('battle.question')}: <span>{hud.questionNumber}</span>/{totalQuestions}
            </span>
            <span className="lives">{livesText}</span>
            <span className={`lobby-timer${remaining <= 10 ? ' is-urgent' : ''}`}>
              ⏱ {timeStr}
            </span>
            <button type="button" className="sound-toggle" onClick={onSoundToggle}>
              {t('battle.sound')}: {soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="question-box">
            <div className="question-text">{hud.question}</div>
          </div>
        </div>
      )}

      {/* Shooter canvas */}
      <ShooterCanvas
        questions={lobby.quiz_questions}
        soundEnabled={soundEnabled}
        active={isPlaying && !localFinished}
        resetSignal={resetSignal}
        endSignal={endSignal}
        onProgress={handleProgress}
        onAnswer={handleAnswer}
        onFinished={handleFinished}
      />

      {/* Tug-of-war arena overlay (bottom) */}
      {isPlaying && (
        <BattleArena
          ropePosition={lobby.rope_position}
          teamAScore={lobby.team_a_score}
          teamBScore={lobby.team_b_score}
          teamAName={teamAName}
          teamBName={teamBName}
          winner={isFinished ? (lobby.winner ?? null) : null}
        />
      )}

      {/* Waiting room */}
      {!isPlaying && !isFinished && (
        <section className="topic-menu is-visible">
          <div className="topic-menu-inner lobby-room">
            <div className="my-quizzes-head">
              <h1 className="battle-waiting-title">
                {isHost ? t('battle.ready') : t('battle.waiting')}
              </h1>
              <button type="button" className="auth-button" onClick={handleExit}>
                {t('battle.exit')}
              </button>
            </div>

            <div className="lobby-code-block">
              <span className="lobby-code-label">{t('battle.code')}</span>
              <span className="lobby-code-big">{lobby.code}</span>
              <button
                type="button"
                className="auth-button"
                onClick={() => navigator.clipboard?.writeText(lobby.code).catch(() => undefined)}
              >
                {t('battle.copy')}
              </button>
            </div>

            <p className="lobby-meta">
              {t('battle.test')}: <strong>{lobby.quiz_title}</strong> · {totalQuestions}{' '}
              {t('battle.questions')} · {t('battle.time')}: <strong>{lobby.time_limit_seconds}s</strong>
            </p>

            {/* Two-team player list */}
            <div className="battle-teams">
              <div className="battle-team battle-team--a">
                <h3 className="battle-team-title">🔴 {t('battle.teamA')}</h3>
                <ul className="lobby-player-list">
                  {teamAPlayers.map((p) => (
                    <li key={p.id} className={p.id === player.id ? 'is-me' : ''}>
                      {p.username}
                      {p.is_host && <em> ★</em>}
                      {p.id === player.id && <em> ({t('battle.you')})</em>}
                    </li>
                  ))}
                  {teamAPlayers.length === 0 && (
                    <li className="lobby-empty">{t('battle.noPlayers')}</li>
                  )}
                </ul>
              </div>
              <div className="battle-team battle-team--b">
                <h3 className="battle-team-title">🔵 {t('battle.teamB')}</h3>
                <ul className="lobby-player-list">
                  {teamBPlayers.map((p) => (
                    <li key={p.id} className={p.id === player.id ? 'is-me' : ''}>
                      {p.username}
                      {p.is_host && <em> ★</em>}
                      {p.id === player.id && <em> ({t('battle.you')})</em>}
                    </li>
                  ))}
                  {teamBPlayers.length === 0 && (
                    <li className="lobby-empty">{t('battle.noPlayers')}</li>
                  )}
                </ul>
              </div>
            </div>

            {isHost ? (
              <button
                type="button"
                className="auth-button auth-button--primary lobby-start"
                onClick={handleStart}
                disabled={players.length < 2}
              >
                {t('battle.start')}
              </button>
            ) : (
              <p className="lobby-waiting">{t('battle.waitingForHost')}</p>
            )}
          </div>
        </section>
      )}

      {/* Result overlay */}
      {(isFinished || (isPlaying && localFinished)) && (
        <div className="overlay is-visible">
          {lobby.winner ? (
            <>
              <h2
                className={
                  lobby.winner === 'draw'
                    ? ''
                    : lobby.winner === player.team
                      ? 'battle-result--won'
                      : 'battle-result--lost'
                }
              >
                {lobby.winner === 'a'
                  ? `🔴 ${t('battle.teamAWon')}`
                  : lobby.winner === 'b'
                    ? `🔵 ${t('battle.teamBWon')}`
                    : `🤝 ${t('battle.draw')}`}
              </h2>
              <div className="battle-final-scores">
                <div className="battle-final-score battle-final-score--a">
                  <span>{t('battle.teamA')}</span>
                  <strong>{lobby.team_a_score}</strong>
                </div>
                <span className="battle-vs">VS</span>
                <div className="battle-final-score battle-final-score--b">
                  <span>{t('battle.teamB')}</span>
                  <strong>{lobby.team_b_score}</strong>
                </div>
              </div>
            </>
          ) : (
            <h2>{localFinished?.won ? t('battle.wonPersonal') : t('battle.timesUp')}</h2>
          )}

          <ol className="final-leaderboard battle-final-leaderboard">
            {[...players]
              .sort((a, b) => b.score - a.score)
              .map((p, i) => (
                <li
                  key={p.id}
                  className={`${p.id === player.id ? 'is-me' : ''} battle-lb-${p.team}`}
                >
                  <span className="lb-rank">{i + 1}.</span>
                  <span className="lb-name">
                    {p.team === 'a' ? '🔴' : '🔵'} {p.username}
                    {p.is_host && <em> ★</em>}
                  </span>
                  <span className="lb-score">{p.score}</span>
                </li>
              ))}
          </ol>

          <div className="overlay-actions">
            <button type="button" onClick={handleExit}>
              {t('battle.exitBtn')}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
