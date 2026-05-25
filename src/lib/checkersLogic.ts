// Russian draughts (shashka) on an 8×8 board.
// Dark squares: (row + col) % 2 === 1  (these are the playable squares).
// Red pieces start at rows 5-7 (bottom), move UP toward row 0.
// Blue pieces start at rows 0-2 (top), move DOWN toward row 7.

export type Color = 'red' | 'blue'
export type Cell = { color: Color; king: boolean } | null
export type Board = Cell[]   // 64 elements, row-major

export type Move = {
  from: number       // source cell index
  to: number         // destination cell index
  jumped: number[]   // indices of captured cells
}

// ── helpers ──────────────────────────────────────────────────────

const rowOf = (i: number) => Math.floor(i / 8)
const colOf = (i: number) => i % 8
const cellIdx = (r: number, c: number) => r * 8 + c
const inBounds = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8
const foe = (c: Color): Color => c === 'red' ? 'blue' : 'red'
export const isDark = (r: number, c: number) => (r + c) % 2 === 1

// ── board init ───────────────────────────────────────────────────

export function initBoard(): Board {
  const b: Board = Array(64).fill(null)
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (!isDark(r, c)) continue
      if (r < 3)      b[cellIdx(r, c)] = { color: 'blue', king: false }
      else if (r > 4) b[cellIdx(r, c)] = { color: 'red',  king: false }
    }
  }
  return b
}

// ── move generation ──────────────────────────────────────────────

const ALL_DIRS: [number, number][] = [[-1,-1],[-1,1],[1,-1],[1,1]]

// Recursively find all complete capture sequences for one piece.
// `board` is the working state (piece moved, captured pieces NOT removed).
// `start` is the original start square.
// `cur` is the current square of the piece.
// `captured` holds already-captured squares (prevents re-capture).
function captureSeqs(
  board: Board,
  start: number,
  cur: number,
  piece: { color: Color; king: boolean },
  captured: number[],
): Move[] {
  const results: Move[] = []
  const cr = rowOf(cur), cc = colOf(cur)

  if (!piece.king) {
    // Simple piece: can capture in all 4 diagonal directions
    for (const [dr, dc] of ALL_DIRS) {
      const mr = cr + dr, mc = cc + dc
      const tr = cr + 2 * dr, tc = cc + 2 * dc
      if (!inBounds(mr, mc) || !inBounds(tr, tc)) continue

      const mi = cellIdx(mr, mc)
      const ti = cellIdx(tr, tc)

      if (
        board[mi]?.color === foe(piece.color) &&
        !captured.includes(mi) &&
        board[ti] === null
      ) {
        const newCap = [...captured, mi]
        const nb = [...board] as Board
        nb[ti] = piece
        nb[cur] = null
        // Captured piece stays in nb (acts as blocker) — only removed in applyMove.

        // Promotion during multi-jump ends the sequence (Russian rules)
        const promotes = (piece.color === 'red' && tr === 0) || (piece.color === 'blue' && tr === 7)
        if (promotes) {
          results.push({ from: start, to: ti, jumped: newCap })
        } else {
          const further = captureSeqs(nb, start, ti, piece, newCap)
          if (further.length) results.push(...further)
          else results.push({ from: start, to: ti, jumped: newCap })
        }
      }
    }
  } else {
    // Flying king: can jump over a piece and land anywhere beyond it
    for (const [dr, dc] of ALL_DIRS) {
      let r = cr + dr, c = cc + dc
      let foeFound = false, foeIdx = -1

      while (inBounds(r, c)) {
        const i = cellIdx(r, c)
        const cell = board[i]

        if (cell !== null) {
          if (cell.color === foe(piece.color) && !captured.includes(i) && !foeFound) {
            foeFound = true
            foeIdx = i
          } else {
            break  // blocked by own piece or second opponent
          }
        } else if (foeFound) {
          // Valid landing square after jump
          const newCap = [...captured, foeIdx]
          const nb = [...board] as Board
          nb[i] = piece
          nb[cur] = null

          const further = captureSeqs(nb, start, i, piece, newCap)
          if (further.length) results.push(...further)
          else results.push({ from: start, to: i, jumped: newCap })
        }

        r += dr
        c += dc
      }
    }
  }

  return results
}

function simpleMoves(board: Board, i: number, piece: { color: Color; king: boolean }): Move[] {
  const results: Move[] = []
  const pr = rowOf(i), pc = colOf(i)

  if (!piece.king) {
    const fwdDirs: [number, number][] = piece.color === 'red' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]
    for (const [dr, dc] of fwdDirs) {
      const nr = pr + dr, nc = pc + dc
      if (inBounds(nr, nc) && board[cellIdx(nr, nc)] === null)
        results.push({ from: i, to: cellIdx(nr, nc), jumped: [] })
    }
  } else {
    for (const [dr, dc] of ALL_DIRS) {
      let r = pr + dr, c = pc + dc
      while (inBounds(r, c) && board[cellIdx(r, c)] === null) {
        results.push({ from: i, to: cellIdx(r, c), jumped: [] })
        r += dr; c += dc
      }
    }
  }

  return results
}

// Returns all legal moves for `color`.
// Mandatory capture: if any capture exists, ONLY captures are returned.
export function getValidMoves(board: Board, color: Color): Move[] {
  const captures: Move[] = []
  const normals: Move[] = []

  for (let i = 0; i < 64; i++) {
    const cell = board[i]
    if (!cell || cell.color !== color) continue
    const caps = captureSeqs(board, i, i, cell, [])
    if (caps.length) captures.push(...caps)
    normals.push(...simpleMoves(board, i, cell))
  }

  return captures.length ? captures : normals
}

// ── apply ────────────────────────────────────────────────────────

export function applyMove(board: Board, move: Move): Board {
  const nb = [...board] as Board
  const piece = nb[move.from]!

  for (const ci of move.jumped) nb[ci] = null

  nb[move.to] = piece
  nb[move.from] = null

  // Promotion
  if (!piece.king) {
    const tr = rowOf(move.to)
    if ((piece.color === 'red' && tr === 0) || (piece.color === 'blue' && tr === 7))
      nb[move.to] = { color: piece.color, king: true }
  }

  return nb
}

// Returns the winner if the next player has no moves, otherwise null.
export function checkResult(board: Board, nextTurn: Color): Color | null {
  return getValidMoves(board, nextTurn).length === 0 ? foe(nextTurn) : null
}

// ── bot AI ───────────────────────────────────────────────────────

function evaluate(board: Board): number {
  // Positive = blue advantage (bot), negative = red advantage (player)
  let score = 0
  for (const cell of board) {
    if (!cell) continue
    const v = cell.king ? 3 : 1
    score += cell.color === 'blue' ? v : -v
  }
  return score
}

function alphabeta(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): number {
  const color: Color = maximizing ? 'blue' : 'red'
  const result = checkResult(board, color)
  if (result !== null) return result === 'blue' ? 900 + depth : -900 - depth
  if (depth === 0) return evaluate(board)

  const moves = getValidMoves(board, color)

  if (maximizing) {
    let best = -Infinity
    for (const m of moves) {
      best = Math.max(best, alphabeta(applyMove(board, m), depth - 1, alpha, beta, false))
      alpha = Math.max(alpha, best)
      if (beta <= alpha) break
    }
    return best
  } else {
    let best = Infinity
    for (const m of moves) {
      best = Math.min(best, alphabeta(applyMove(board, m), depth - 1, alpha, beta, true))
      beta = Math.min(beta, best)
      if (beta <= alpha) break
    }
    return best
  }
}

export type CheckersDifficulty = 'easy' | 'medium' | 'hard'

export function getBotMove(board: Board, difficulty: CheckersDifficulty): Move | null {
  const moves = getValidMoves(board, 'blue')
  if (!moves.length) return null

  if (difficulty === 'easy') {
    return moves[Math.floor(Math.random() * moves.length)]
  }

  if (difficulty === 'medium') {
    // Prefer multi-captures → single captures → random
    const sorted = [...moves].sort((a, b) => b.jumped.length - a.jumped.length)
    const maxCap = sorted[0].jumped.length
    if (maxCap > 0) {
      const best = sorted.filter(m => m.jumped.length === maxCap)
      return best[Math.floor(Math.random() * best.length)]
    }
    return moves[Math.floor(Math.random() * moves.length)]
  }

  // Hard: alpha-beta depth 4
  let bestScore = -Infinity
  let bestMove = moves[0]
  for (const m of moves) {
    const score = alphabeta(applyMove(board, m), 3, -Infinity, Infinity, false)
    if (score > bestScore) { bestScore = score; bestMove = m }
  }
  return bestMove
}
