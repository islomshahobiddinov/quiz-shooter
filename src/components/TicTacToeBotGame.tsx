import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { checkWinner } from '../lib/tictactoeApi'
import type { TttBoard } from '../lib/tictactoeApi'

export type BotDifficulty = 'easy' | 'medium' | 'hard'

type Props = {
  username: string
  difficulty: BotDifficulty
  onExit: () => void
}

// Minimax (unbeatable) — bot is O, player is X
function minimax(board: TttBoard, isMaximizing: boolean): number {
  const w = checkWinner(board)
  if (w === 'O') return 10
  if (w === 'X') return -10
  if (w === 'draw') return 0

  if (isMaximizing) {
    let best = -Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'O'
        best = Math.max(best, minimax(board, false))
        board[i] = ''
      }
    }
    return best
  } else {
    let best = Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'X'
        best = Math.min(best, minimax(board, true))
        board[i] = ''
      }
    }
    return best
  }
}

function getHardMove(board: TttBoard): number {
  let best = -Infinity
  let move = -1
  for (let i = 0; i < 9; i++) {
    if (board[i] === '') {
      board[i] = 'O'
      const score = minimax(board, false)
      board[i] = ''
      if (score > best) { best = score; move = i }
    }
  }
  return move
}

function getRandomMove(board: TttBoard): number {
  const empty = board.flatMap((c, i) => c === '' ? [i] : [])
  return empty[Math.floor(Math.random() * empty.length)]
}

// Medium: win if possible, block if needed, else random
function getMediumMove(board: TttBoard): number {
  for (let i = 0; i < 9; i++) {
    if (board[i] === '') {
      board[i] = 'O'
      if (checkWinner(board) === 'O') { board[i] = ''; return i }
      board[i] = ''
    }
  }
  for (let i = 0; i < 9; i++) {
    if (board[i] === '') {
      board[i] = 'X'
      if (checkWinner(board) === 'X') { board[i] = ''; return i }
      board[i] = ''
    }
  }
  return getRandomMove(board)
}

function getBotMove(board: TttBoard, diff: BotDifficulty): number {
  const copy = [...board] as TttBoard
  if (diff === 'easy') return getRandomMove(copy)
  if (diff === 'medium') return getMediumMove(copy)
  return getHardMove(copy)
}

const EMPTY: TttBoard = ['', '', '', '', '', '', '', '', '']

export function TicTacToeBotGame({ username, difficulty, onExit }: Props) {
  const { t } = useTranslation()
  const [board, setBoard] = useState<TttBoard>([...EMPTY])
  const [currentSymbol, setCurrentSymbol] = useState<'X' | 'O'>('X')
  const [winner, setWinner] = useState<string | null>(null)
  const [botThinking, setBotThinking] = useState(false)
  const [scores, setScores] = useState({ player: 0, bot: 0, draw: 0 })

  const applyMove = useCallback((b: TttBoard, sym: 'X' | 'O', idx: number) => {
    const next = [...b] as TttBoard
    next[idx] = sym
    const w = checkWinner(next)
    setBoard(next)
    if (w) {
      setWinner(w)
      setScores((s) => ({
        player: s.player + (w === 'X' ? 1 : 0),
        bot: s.bot + (w === 'O' ? 1 : 0),
        draw: s.draw + (w === 'draw' ? 1 : 0),
      }))
    } else {
      setCurrentSymbol(sym === 'X' ? 'O' : 'X')
    }
  }, [])

  // Bot move after player's turn
  useEffect(() => {
    if (currentSymbol !== 'O' || winner !== null) return
    setBotThinking(true)
    const delay = difficulty === 'easy' ? 350 : difficulty === 'medium' ? 550 : 750
    const id = setTimeout(() => {
      const move = getBotMove(board, difficulty)
      if (move !== -1) applyMove(board, 'O', move)
      setBotThinking(false)
    }, delay)
    return () => clearTimeout(id)
  }, [currentSymbol, winner, board, difficulty, applyMove])

  const handleCellClick = (idx: number) => {
    if (currentSymbol !== 'X' || winner !== null || board[idx] !== '' || botThinking) return
    applyMove(board, 'X', idx)
  }

  const handleReset = () => {
    setBoard([...EMPTY])
    setCurrentSymbol('X')
    setWinner(null)
    setBotThinking(false)
  }

  const isFinished = winner !== null
  const isMyTurn = currentSymbol === 'X' && !isFinished

  const getStatusText = () => {
    if (botThinking) return t('ttt.botThinking')
    if (!isFinished) return isMyTurn ? t('ttt.yourTurn') : t('ttt.botTurn')
    if (winner === 'draw') return t('ttt.draw')
    return winner === 'X' ? t('ttt.youWon') : t('ttt.botWon')
  }

  const statusClass = isFinished
    ? (winner === 'draw' ? 'is-draw' : winner === 'X' ? 'is-win' : 'is-lose')
    : isMyTurn ? 'is-my-turn' : ''

  const diffKey = `ttt.difficulty${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}` as const

  return (
    <div className="ttt-fullscreen">
      <div className="ttt-header">
        <div className="ttt-header-left">
          <span className="ttt-brand">TIC TAC TOE</span>
          <span className="ttt-bot-badge">{t('ttt.vsBot')} · {t(diffKey)}</span>
        </div>
        <button type="button" className="ttt-exit-btn" onClick={onExit}>
          {t('ttt.exit')}
        </button>
      </div>

      <div className="ttt-main">
        <div className="ttt-score-board">
          <div className="ttt-score-item is-player">
            <span className="ttt-score-name">{username}</span>
            <span className="ttt-score-num">{scores.player}</span>
          </div>
          <div className="ttt-score-item is-draw">
            <span className="ttt-score-name">{t('ttt.drawShort')}</span>
            <span className="ttt-score-num">{scores.draw}</span>
          </div>
          <div className="ttt-score-item is-bot">
            <span className="ttt-score-name">{t('ttt.bot')}</span>
            <span className="ttt-score-num">{scores.bot}</span>
          </div>
        </div>

        <div className="ttt-players-bar">
          <div className={`ttt-player-chip is-x${currentSymbol === 'X' && !isFinished ? ' is-active' : ''}`}>
            <span className="ttt-symbol-badge">X</span>
            <span className="ttt-chip-name">
              {username} <em>{t('ttt.you')}</em>
            </span>
          </div>
          <span className="ttt-vs">VS</span>
          <div className={`ttt-player-chip is-o${currentSymbol === 'O' && !isFinished ? ' is-active' : ''}`}>
            <span className="ttt-symbol-badge">O</span>
            <span className="ttt-chip-name">
              {t('ttt.bot')} <em>({t(diffKey)})</em>
            </span>
          </div>
        </div>

        <div className={`ttt-status ${statusClass}`}>{getStatusText()}</div>

        <div className="ttt-board">
          {board.map((cell, i) => {
            const canClick = isMyTurn && cell === '' && !botThinking
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

        {isFinished && (
          <div className="ttt-over-actions">
            <button type="button" className="ttt-btn ttt-btn--primary" onClick={handleReset}>
              {t('ttt.playAgain')}
            </button>
            <button type="button" className="ttt-btn" onClick={onExit}>
              {t('ttt.exit')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
