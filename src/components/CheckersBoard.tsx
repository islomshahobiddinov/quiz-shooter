import type { Board, Color, Move } from '../lib/checkersLogic'
import { isDark } from '../lib/checkersLogic'

type Props = {
  board: Board
  myColor: Color
  validMoves: Move[]          // all legal moves for the active player
  selected: number | null
  lastMove: Move | null
  onCellClick: (idx: number) => void
  disabled?: boolean
}

export function CheckersBoard({
  board,
  myColor,
  validMoves,
  selected,
  lastMove,
  onCellClick,
  disabled = false,
}: Props) {
  const selectablePieces = new Set(validMoves.map(m => m.from))
  const validDests = selected !== null
    ? new Set(validMoves.filter(m => m.from === selected).map(m => m.to))
    : new Set<number>()
  const lastSquares = lastMove ? new Set([lastMove.from, lastMove.to]) : new Set<number>()
  const capturedSquares = lastMove ? new Set(lastMove.jumped) : new Set<number>()

  // For blue player: flip the board so their pieces are at the bottom
  const indices = myColor === 'blue'
    ? Array.from({ length: 64 }, (_, i) => 63 - i)
    : Array.from({ length: 64 }, (_, i) => i)

  return (
    <div className="cb-board">
      {indices.map((cellIndex) => {
        const r = Math.floor(cellIndex / 8)
        const c = cellIndex % 8
        const dark = isDark(r, c)
        const piece = board[cellIndex]
        const isSel = selected === cellIndex
        const isDest = validDests.has(cellIndex)
        const isLast = lastSquares.has(cellIndex)
        const isCaptured = capturedSquares.has(cellIndex)
        const isPickable = dark && !disabled && piece?.color === myColor && selectablePieces.has(cellIndex)

        const cellClass = [
          'cb-cell',
          dark ? 'cb-cell--dark' : 'cb-cell--light',
          isSel    ? 'cb-cell--selected' : '',
          isDest   ? 'cb-cell--dest'     : '',
          isLast   ? 'cb-cell--last'     : '',
          isCaptured ? 'cb-cell--captured' : '',
          isPickable ? 'cb-cell--pickable' : '',
        ].filter(Boolean).join(' ')

        return (
          <div
            key={cellIndex}
            className={cellClass}
            onClick={() => dark && !disabled && onCellClick(cellIndex)}
          >
            {piece && (
              <div className={[
                'cb-piece',
                `cb-piece--${piece.color}`,
                piece.king ? 'cb-piece--king' : '',
                isSel ? 'cb-piece--sel' : '',
              ].filter(Boolean).join(' ')}>
                {piece.king && <span className="cb-crown">♛</span>}
              </div>
            )}
            {isDest && !piece && <div className="cb-dot" />}
          </div>
        )
      })}
    </div>
  )
}
