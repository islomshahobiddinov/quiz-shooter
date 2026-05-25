import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Board, Color, Move } from '../lib/checkersLogic'
import {
  applyMove,
  checkResult,
  getBotMove,
  getValidMoves,
  initBoard,
} from '../lib/checkersLogic'
import type { CheckersDifficulty } from '../lib/checkersLogic'
import { CheckersBoard } from './CheckersBoard'

type Props = {
  username: string
  difficulty: CheckersDifficulty
  onExit: () => void
}

type GameState = {
  board: Board
  currentColor: Color
  winner: Color | null
}

export function CheckersBotGame({ username, difficulty, onExit }: Props) {
  const { t } = useTranslation()
  const [gs, setGs] = useState<GameState>({
    board: initBoard(),
    currentColor: 'red',
    winner: null,
  })
  const [selected, setSelected] = useState<number | null>(null)
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [botThinking, setBotThinking] = useState(false)
  const [scores, setScores] = useState({ red: 0, blue: 0 })

  const validMoves = useMemo(
    () => gs.winner === null && gs.currentColor === 'red' ? getValidMoves(gs.board, 'red') : [],
    [gs],
  )

  const execMove = useCallback((board: Board, move: Move, nextColor: Color) => {
    const newBoard = applyMove(board, move)
    const result = checkResult(newBoard, nextColor)
    setGs({ board: newBoard, currentColor: nextColor, winner: result })
    setLastMove(move)
    setSelected(null)
    if (result) setScores(s => ({ ...s, [result]: s[result as 'red' | 'blue'] + 1 }))
  }, [])

  // Bot turn
  useEffect(() => {
    if (gs.currentColor !== 'blue' || gs.winner !== null) return
    setBotThinking(true)
    const delay = difficulty === 'easy' ? 400 : difficulty === 'medium' ? 650 : 900
    const id = setTimeout(() => {
      const move = getBotMove(gs.board, difficulty)
      if (move) execMove(gs.board, move, 'red')
      setBotThinking(false)
    }, delay)
    return () => clearTimeout(id)
  }, [gs, difficulty, execMove])

  const handleCellClick = (idx: number) => {
    if (gs.currentColor !== 'red' || gs.winner !== null || botThinking) return
    const piece = gs.board[idx]

    if (selected !== null && validMoves.some(m => m.from === selected && m.to === idx)) {
      const move = validMoves.find(m => m.from === selected && m.to === idx)!
      execMove(gs.board, move, 'blue')
    } else if (piece?.color === 'red' && validMoves.some(m => m.from === idx)) {
      setSelected(idx)
    } else {
      setSelected(null)
    }
  }

  const handleReset = () => {
    setGs({ board: initBoard(), currentColor: 'red', winner: null })
    setSelected(null)
    setLastMove(null)
    setBotThinking(false)
  }

  const isMyTurn = gs.currentColor === 'red' && !gs.winner

  const getStatusText = () => {
    if (botThinking) return t('checkers.botThinking')
    if (gs.winner) {
      if (gs.winner === 'red') return t('checkers.youWon')
      return t('checkers.botWon')
    }
    return isMyTurn ? t('checkers.yourTurn') : t('checkers.botTurn')
  }

  const statusClass = gs.winner
    ? (gs.winner === 'red' ? 'is-win' : 'is-lose')
    : isMyTurn ? 'is-my-turn' : ''

  const diffKey = `checkers.difficulty${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}` as const

  // Count pieces
  const redCount = gs.board.filter(c => c?.color === 'red').length
  const blueCount = gs.board.filter(c => c?.color === 'blue').length

  return (
    <div className="checkers-fullscreen">
      <div className="checkers-header">
        <div className="checkers-header-left">
          <span className="checkers-brand">SHASHKA</span>
          <span className="checkers-bot-badge">{t('checkers.vsBot')} · {t(diffKey)}</span>
        </div>
        <button type="button" className="checkers-exit-btn" onClick={onExit}>
          {t('checkers.exit')}
        </button>
      </div>

      <div className="checkers-main">
        <div className="checkers-score-row">
          <div className="checkers-score-item is-red">
            <span className="checkers-score-name">{username} <em>{t('checkers.you')}</em></span>
            <span className="checkers-piece-count">{redCount} {t('checkers.pieces')}</span>
            <span className="checkers-score-num">{scores.red}</span>
          </div>
          <div className="checkers-score-item is-blue">
            <span className="checkers-score-name">{t('checkers.bot')} <em>({t(diffKey)})</em></span>
            <span className="checkers-piece-count">{blueCount} {t('checkers.pieces')}</span>
            <span className="checkers-score-num">{scores.blue}</span>
          </div>
        </div>

        <div className={`checkers-status ${statusClass}`}>{getStatusText()}</div>

        <CheckersBoard
          board={gs.board}
          myColor="red"
          validMoves={validMoves}
          selected={selected}
          lastMove={lastMove}
          onCellClick={handleCellClick}
          disabled={gs.currentColor !== 'red' || !!gs.winner || botThinking}
        />

        {gs.winner && (
          <div className="checkers-over-actions">
            <button type="button" className="checkers-btn checkers-btn--primary" onClick={handleReset}>
              {t('checkers.playAgain')}
            </button>
            <button type="button" className="checkers-btn" onClick={onExit}>
              {t('checkers.exit')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
