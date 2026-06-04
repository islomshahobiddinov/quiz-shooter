import type { WordEntry } from './crosswordTopics'

export type Direction = 'across' | 'down'

export type PlacedWord = WordEntry & {
  startRow: number
  startCol: number
  direction: Direction
}

export type GeneratedCrossword = {
  words: PlacedWord[]
  rows: number
  cols: number
}

const WORK_SIZE = 40
const CENTER = 20

function ck(r: number, c: number) { return `${r},${c}` }

function canPlace(
  word: string,
  row: number,
  col: number,
  dir: Direction,
  grid: Map<string, string>,
  isFirst: boolean,
): boolean {
  if (row < 0 || col < 0) return false
  const endR = dir === 'down' ? row + word.length - 1 : row
  const endC = dir === 'across' ? col + word.length - 1 : col
  if (endR >= WORK_SIZE || endC >= WORK_SIZE) return false

  // Cell before word start must be empty
  const br = dir === 'down' ? row - 1 : row
  const bc = dir === 'across' ? col - 1 : col
  if (br >= 0 && bc >= 0 && grid.has(ck(br, bc))) return false

  // Cell after word end must be empty
  const ar = dir === 'down' ? row + word.length : row
  const ac = dir === 'across' ? col + word.length : col
  if (ar < WORK_SIZE && ac < WORK_SIZE && grid.has(ck(ar, ac))) return false

  let intersections = 0

  for (let i = 0; i < word.length; i++) {
    const r = dir === 'down' ? row + i : row
    const c = dir === 'across' ? col + i : col
    const existing = grid.get(ck(r, c))

    if (existing) {
      if (existing !== word[i]) return false  // letter conflict
      intersections++
    } else {
      // New cell — must not touch parallel adjacent cells
      if (dir === 'across') {
        if (grid.has(ck(r - 1, c)) || grid.has(ck(r + 1, c))) return false
      } else {
        if (grid.has(ck(r, c - 1)) || grid.has(ck(r, c + 1))) return false
      }
    }
  }

  return isFirst || intersections > 0
}

function placeWord(word: string, row: number, col: number, dir: Direction, grid: Map<string, string>) {
  for (let i = 0; i < word.length; i++) {
    const r = dir === 'down' ? row + i : row
    const c = dir === 'across' ? col + i : col
    grid.set(ck(r, c), word[i])
  }
}

export function generateCrossword(entries: WordEntry[]): GeneratedCrossword | null {
  // Sort longest first so large words form the backbone
  const sorted = [...entries].sort((a, b) => b.word.length - a.word.length)

  const grid = new Map<string, string>()
  const placed: PlacedWord[] = []

  // Place first word horizontally at center
  const first = sorted[0]
  const firstRow = CENTER
  const firstCol = CENTER - Math.floor(first.word.length / 2)
  placeWord(first.word, firstRow, firstCol, 'across', grid)
  placed.push({ ...first, startRow: firstRow, startCol: firstCol, direction: 'across' })

  // Try to place each remaining word
  for (let wi = 1; wi < sorted.length; wi++) {
    const entry = sorted[wi]
    let found = false

    for (const pw of placed) {
      if (found) break
      // New word goes perpendicular to placed word
      const newDir: Direction = pw.direction === 'across' ? 'down' : 'across'

      for (let pi = 0; pi < pw.word.length && !found; pi++) {
        const pr = pw.direction === 'down' ? pw.startRow + pi : pw.startRow
        const pc = pw.direction === 'across' ? pw.startCol + pi : pw.startCol
        const letter = pw.word[pi]

        for (let ni = 0; ni < entry.word.length && !found; ni++) {
          if (entry.word[ni] === letter) {
            const newRow = newDir === 'down' ? pr - ni : pr
            const newCol = newDir === 'across' ? pc - ni : pc

            if (canPlace(entry.word, newRow, newCol, newDir, grid, false)) {
              placeWord(entry.word, newRow, newCol, newDir, grid)
              placed.push({ ...entry, startRow: newRow, startCol: newCol, direction: newDir })
              found = true
            }
          }
        }
      }
    }
    // If a word can't be placed, skip it silently
  }

  if (placed.length < 4) return null

  // Find bounding box and normalize to (0,0)
  let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity
  for (const k of grid.keys()) {
    const [r, c] = k.split(',').map(Number)
    minR = Math.min(minR, r)
    minC = Math.min(minC, c)
    maxR = Math.max(maxR, r)
    maxC = Math.max(maxC, c)
  }

  const normalizedWords = placed.map(pw => ({
    ...pw,
    startRow: pw.startRow - minR,
    startCol: pw.startCol - minC,
  }))

  return {
    words: normalizedWords,
    rows: maxR - minR + 1,
    cols: maxC - minC + 1,
  }
}
