import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TttLobby, TttPlayer } from '../lib/tictactoeApi'
import {
  makeTttMove,
  resetTttGame,
  subscribeToTttLobby,
  subscribeToTttPlayers,
} from '../lib/tictactoeApi'

type Props = {
  lobby: TttLobby
  player: TttPlayer
  onExit: () => void
}

export function TicTacToeGame({ lobby: initialLobby, player, onExit }: Props) {
  const { t } = useTranslation()
  const [lobby, setLobby] = useState(initialLobby)
  const [players, setPlayers] = useState<TttPlayer[]>([])
  const [moving, setMoving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const unsubLobby = subscribeToTttLobby(initialLobby.id, setLobby)
    const unsubPlayers = subscribeToTttPlayers(initialLobby.id, setPlayers)
    return () => { unsubLobby(); unsubPlayers() }
  }, [initialLobby.id])

  const opponent = players.find((p) => p.id !== player.id)
  const isMyTurn = lobby.status === 'playing' && lobby.current_symbol === player.symbol

  const handleCellClick = async (index: number) => {
    if (!isMyTurn || moving || lobby.board[index] !== '' || lobby.status !== 'playing') return
    setMoving(true)
    try {
      await makeTttMove(lobby.id, index, player.symbol, lobby.board)
    } catch {
      // ignore race condition errors
    } finally {
      setMoving(false)
    }
  }

  const handleReset = async () => {
    if (!player.is_host) return
    try {
      await resetTttGame(lobby.id)
    } catch (e) {
      console.error(e)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(lobby.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const winnerPlayer = lobby.winner === 'draw' ? null : players.find((p) => p.symbol === lobby.winner)

  const getStatusText = () => {
    if (lobby.status === 'waiting') return t('ttt.waitingForOpponent')
    if (lobby.status === 'finished') {
      if (lobby.winner === 'draw') return t('ttt.draw')
      if (winnerPlayer?.id === player.id) return t('ttt.youWon')
      return t('ttt.youLost', { name: winnerPlayer?.username ?? '' })
    }
    if (isMyTurn) return t('ttt.yourTurn')
    return t('ttt.opponentTurn', { name: opponent?.username ?? '…' })
  }

  const statusClass = lobby.status === 'finished'
    ? (lobby.winner === 'draw' ? 'is-draw' : winnerPlayer?.id === player.id ? 'is-win' : 'is-lose')
    : isMyTurn ? 'is-my-turn' : ''

  return (
    <div className="ttt-fullscreen">
      <div className="ttt-header">
        <div className="ttt-header-left">
          <span className="ttt-brand">TIC TAC TOE</span>
          <div className="ttt-code-row">
            <span className="ttt-code-label">{t('ttt.code')}</span>
            <span className="ttt-code-value">{lobby.code}</span>
            <button type="button" className="ttt-copy-btn" onClick={handleCopy}>
              {copied ? '✓' : t('ttt.copy')}
            </button>
          </div>
        </div>
        <button type="button" className="ttt-exit-btn" onClick={onExit}>
          {t('ttt.exit')}
        </button>
      </div>

      <div className="ttt-main">
        <div className="ttt-players-bar">
          <div className={`ttt-player-chip is-x${lobby.current_symbol === 'X' && lobby.status === 'playing' ? ' is-active' : ''}`}>
            <span className="ttt-symbol-badge">X</span>
            <span className="ttt-chip-name">
              {players.find((p) => p.symbol === 'X')?.username ?? '…'}
              {player.symbol === 'X' && <em> {t('ttt.you')}</em>}
            </span>
          </div>

          <span className="ttt-vs">VS</span>

          <div className={`ttt-player-chip is-o${lobby.current_symbol === 'O' && lobby.status === 'playing' ? ' is-active' : ''}`}>
            <span className="ttt-symbol-badge">O</span>
            <span className="ttt-chip-name">
              {players.find((p) => p.symbol === 'O')?.username ?? t('ttt.waitingShort')}
              {player.symbol === 'O' && <em> {t('ttt.you')}</em>}
            </span>
          </div>
        </div>

        <div className={`ttt-status ${statusClass}`}>{getStatusText()}</div>

        <div className={`ttt-board${lobby.status === 'waiting' ? ' is-disabled' : ''}`}>
          {lobby.board.map((cell, i) => {
            const canClick = isMyTurn && cell === '' && lobby.status === 'playing' && !moving
            return (
              <button
                key={i}
                type="button"
                className={`ttt-cell${cell === 'X' ? ' is-x' : cell === 'O' ? ' is-o' : ''}${canClick ? ' is-clickable' : ''}`}
                onClick={() => handleCellClick(i)}
                disabled={!canClick}
              >
                {cell}
              </button>
            )
          })}
        </div>

        {lobby.status === 'finished' && (
          <div className="ttt-over-actions">
            {player.is_host && (
              <button type="button" className="ttt-btn ttt-btn--primary" onClick={handleReset}>
                {t('ttt.playAgain')}
              </button>
            )}
            {!player.is_host && (
              <p className="ttt-waiting-reset">{t('ttt.waitingForReset')}</p>
            )}
            <button type="button" className="ttt-btn" onClick={onExit}>
              {t('ttt.exit')}
            </button>
          </div>
        )}

        {lobby.status === 'waiting' && (
          <p className="ttt-waiting-msg">{t('ttt.shareCode')}</p>
        )}
      </div>
    </div>
  )
}
