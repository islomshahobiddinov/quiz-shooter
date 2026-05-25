import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CheckersLobby, CheckersPlayer } from '../lib/checkersApi'
import {
  makeCheckersMove,
  subscribeToCheckersLobby,
  subscribeToCheckersPlayers,
} from '../lib/checkersApi'
import type { Move } from '../lib/checkersLogic'
import { applyMove, checkResult, getValidMoves } from '../lib/checkersLogic'
import { CheckersBoard } from './CheckersBoard'

type Props = {
  lobby: CheckersLobby
  player: CheckersPlayer
  onExit: () => void
}

export function CheckersGame({ lobby: initialLobby, player, onExit }: Props) {
  const { t } = useTranslation()
  const [lobby, setLobby] = useState(initialLobby)
  const [players, setPlayers] = useState<CheckersPlayer[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [moving, setMoving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const u1 = subscribeToCheckersLobby(initialLobby.id, setLobby)
    const u2 = subscribeToCheckersPlayers(initialLobby.id, setPlayers)
    return () => { u1(); u2() }
  }, [initialLobby.id])

  const isMyTurn = lobby.status === 'playing' && lobby.current_color === player.color
  const opponent = players.find(p => p.id !== player.id)

  const validMoves = useMemo(
    () => isMyTurn ? getValidMoves(lobby.board, player.color) : [],
    [lobby.board, player.color, isMyTurn],
  )

  const handleCellClick = async (idx: number) => {
    if (!isMyTurn || moving || lobby.status !== 'playing') return
    const piece = lobby.board[idx]

    if (selected !== null && validMoves.some(m => m.from === selected && m.to === idx)) {
      const move = validMoves.find(m => m.from === selected && m.to === idx)!
      setMoving(true)
      setSelected(null)
      try {
        const newBoard = applyMove(lobby.board, move)
        const nextColor = player.color === 'red' ? 'blue' : 'red'
        const winner = checkResult(newBoard, nextColor)
        await makeCheckersMove(lobby.id, newBoard, nextColor, winner)
        setLastMove(move)
      } catch (e) { console.error(e) }
      finally { setMoving(false) }
    } else if (piece?.color === player.color && validMoves.some(m => m.from === idx)) {
      setSelected(idx)
    } else {
      setSelected(null)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(lobby.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const winnerPlayer = players.find(p => p.color === lobby.winner)

  const getStatusText = () => {
    if (lobby.status === 'waiting') return t('checkers.waitingForOpponent')
    if (lobby.status === 'finished') {
      if (winnerPlayer?.id === player.id) return t('checkers.youWon')
      return t('checkers.opponentWon', { name: winnerPlayer?.username ?? '' })
    }
    if (isMyTurn) return t('checkers.yourTurn')
    return t('checkers.opponentTurn', { name: opponent?.username ?? '…' })
  }

  const statusClass = lobby.status === 'finished'
    ? (winnerPlayer?.id === player.id ? 'is-win' : 'is-lose')
    : isMyTurn ? 'is-my-turn' : ''

  const redPlayer = players.find(p => p.color === 'red')
  const bluePlayer = players.find(p => p.color === 'blue')
  const redCount = lobby.board.filter(c => c?.color === 'red').length
  const blueCount = lobby.board.filter(c => c?.color === 'blue').length

  return (
    <div className="checkers-fullscreen">
      <div className="checkers-header">
        <div className="checkers-header-left">
          <span className="checkers-brand">SHASHKA</span>
          <div className="checkers-code-row">
            <span className="checkers-code-label">{t('checkers.code')}</span>
            <span className="checkers-code-value">{lobby.code}</span>
            <button type="button" className="checkers-copy-btn" onClick={handleCopy}>
              {copied ? '✓' : t('checkers.copy')}
            </button>
          </div>
        </div>
        <button type="button" className="checkers-exit-btn" onClick={onExit}>
          {t('checkers.exit')}
        </button>
      </div>

      <div className="checkers-main">
        <div className="checkers-score-row">
          <div className={`checkers-score-item is-red${lobby.current_color === 'red' && lobby.status === 'playing' ? ' is-active' : ''}`}>
            <span className="checkers-score-name">
              {redPlayer?.username ?? '…'}
              {player.color === 'red' && <em> {t('checkers.you')}</em>}
            </span>
            <span className="checkers-piece-count">{redCount} {t('checkers.pieces')}</span>
          </div>
          <div className={`checkers-score-item is-blue${lobby.current_color === 'blue' && lobby.status === 'playing' ? ' is-active' : ''}`}>
            <span className="checkers-score-name">
              {bluePlayer?.username ?? t('checkers.waitingShort')}
              {player.color === 'blue' && <em> {t('checkers.you')}</em>}
            </span>
            <span className="checkers-piece-count">{blueCount} {t('checkers.pieces')}</span>
          </div>
        </div>

        <div className={`checkers-status ${statusClass}`}>{getStatusText()}</div>

        <CheckersBoard
          board={lobby.board}
          myColor={player.color}
          validMoves={validMoves}
          selected={selected}
          lastMove={lastMove}
          onCellClick={handleCellClick}
          disabled={!isMyTurn || moving || lobby.status !== 'playing'}
        />

        {lobby.status === 'waiting' && (
          <p className="checkers-waiting-msg">{t('checkers.shareCode')}</p>
        )}

        {lobby.status === 'finished' && (
          <div className="checkers-over-actions">
            <button type="button" className="checkers-btn" onClick={onExit}>
              {t('checkers.exit')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
