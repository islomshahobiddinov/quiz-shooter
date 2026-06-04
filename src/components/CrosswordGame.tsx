import { useState, useRef, useCallback, useMemo } from 'react'
import type { PlacedWord, Direction, GeneratedCrossword } from '../data/crosswordGenerator'

type CellKey = string

type CellData = {
  letter: string
  number?: number
  wordIds: number[]
}

function ck(row: number, col: number): CellKey { return `${row},${col}` }

function buildCellMap(words: PlacedWord[]) {
  // Assign numbers in reading order (top-to-bottom, left-to-right)
  const sorted = [...words].sort((a, b) =>
    a.startRow !== b.startRow ? a.startRow - b.startRow : a.startCol - b.startCol
  )
  const startNums = new Map<CellKey, number>()
  let n = 1
  for (const w of sorted) {
    const k = ck(w.startRow, w.startCol)
    if (!startNums.has(k)) startNums.set(k, n++)
  }

  const cells = new Map<CellKey, CellData>()
  words.forEach((w, idx) => {
    for (let i = 0; i < w.word.length; i++) {
      const row = w.direction === 'down' ? w.startRow + i : w.startRow
      const col = w.direction === 'across' ? w.startCol + i : w.startCol
      const k = ck(row, col)
      const existing = cells.get(k)
      if (existing) {
        existing.wordIds.push(idx)
      } else {
        cells.set(k, {
          letter: w.word[i],
          number: i === 0 ? startNums.get(ck(w.startRow, w.startCol)) : undefined,
          wordIds: [idx],
        })
      }
    }
  })

  const wordNums = new Map<number, number>()
  words.forEach((w, idx) => {
    const num = startNums.get(ck(w.startRow, w.startCol))
    if (num !== undefined) wordNums.set(idx, num)
  })

  return { cells, wordNums }
}

type Props = {
  crossword: GeneratedCrossword
  topicTitle: string
  onBack: () => void
}

export function CrosswordGame({ crossword, topicTitle, onBack }: Props) {
  const { words, rows, cols } = crossword
  const { cells: CELLS, wordNums: WORD_NUMS } = useMemo(() => buildCellMap(words), [words])

  const [userInput, setUserInput] = useState<Record<CellKey, string>>({})
  const [selKey, setSelKey] = useState<CellKey | null>(null)
  const [activeWordIdx, setActiveWordIdx] = useState<number | null>(null)
  const [dir, setDir] = useState<Direction>('across')
  const [checked, setChecked] = useState(false)
  const [solved, setSolved] = useState(false)

  const refs = useRef<Record<CellKey, HTMLInputElement | null>>({})

  const doSelect = useCallback((row: number, col: number, preferDir?: Direction) => {
    const k = ck(row, col)
    const cell = CELLS.get(k)
    if (!cell) return

    const wordsHere = cell.wordIds.map(idx => ({ idx, word: words[idx] }))
    const aEntry = wordsHere.find(e => e.word.direction === 'across')
    const dEntry = wordsHere.find(e => e.word.direction === 'down')
    const wantDir = preferDir ?? dir

    let chosen: { idx: number; word: PlacedWord } | undefined
    if (wantDir === 'across' && aEntry) chosen = aEntry
    else if (wantDir === 'down' && dEntry) chosen = dEntry
    else chosen = aEntry ?? dEntry

    if (!chosen) return

    setSelKey(k)
    setActiveWordIdx(chosen.idx)
    setDir(chosen.word.direction)
    setChecked(false)
    setTimeout(() => {
      const el = refs.current[k]
      if (el) { el.focus(); el.select() }
    }, 0)
  }, [dir, CELLS, words])

  const advance = useCallback((row: number, col: number, d: Direction) => {
    const nr = d === 'down' ? row + 1 : row
    const nc = d === 'across' ? col + 1 : col
    if (CELLS.has(ck(nr, nc))) doSelect(nr, nc, d)
  }, [doSelect, CELLS])

  const retreat = useCallback((row: number, col: number, d: Direction) => {
    const pr = d === 'down' ? row - 1 : row
    const pc = d === 'across' ? col - 1 : col
    if (CELLS.has(ck(pr, pc))) doSelect(pr, pc, d)
  }, [doSelect, CELLS])

  const handleCellClick = (row: number, col: number) => {
    const k = ck(row, col)
    if (k === selKey) {
      const cell = CELLS.get(k)!
      const wordsHere = cell.wordIds.map(idx => words[idx])
      if (wordsHere.some(w => w.direction === 'across') && wordsHere.some(w => w.direction === 'down')) {
        doSelect(row, col, dir === 'across' ? 'down' : 'across')
        return
      }
    }
    doSelect(row, col)
  }

  const handleChange = (row: number, col: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const letter = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(-1)
    const k = ck(row, col)
    setUserInput(prev => ({ ...prev, [k]: letter }))
    if (letter) advance(row, col, dir)
  }

  const handleKeyDown = (row: number, col: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const k = ck(row, col)
      if (userInput[k]) {
        setUserInput(prev => ({ ...prev, [k]: '' }))
      } else {
        const pr = dir === 'down' ? row - 1 : row
        const pc = dir === 'across' ? col - 1 : col
        const pk = ck(pr, pc)
        if (CELLS.has(pk)) {
          retreat(row, col, dir)
          setUserInput(prev => ({ ...prev, [pk]: '' }))
        }
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      if (CELLS.has(ck(row, col + 1))) doSelect(row, col + 1, 'across')
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (CELLS.has(ck(row, col - 1))) doSelect(row, col - 1, 'across')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (CELLS.has(ck(row + 1, col))) doSelect(row + 1, col, 'down')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (CELLS.has(ck(row - 1, col))) doSelect(row - 1, col, 'down')
    }
  }

  const checkAnswers = () => {
    setChecked(true)
    const allCorrect = [...CELLS.entries()].every(([k, c]) => (userInput[k] ?? '') === c.letter)
    if (allCorrect) setSolved(true)
  }

  const revealAll = () => {
    const full: Record<CellKey, string> = {}
    for (const [k, c] of CELLS.entries()) full[k] = c.letter
    setUserInput(full)
    setSolved(true)
    setChecked(false)
  }

  const resetAll = () => {
    setUserInput({})
    setChecked(false)
    setSolved(false)
    setSelKey(null)
    setActiveWordIdx(null)
  }

  const activeWordCells = useMemo(() => {
    if (activeWordIdx === null) return new Set<CellKey>()
    const word = words[activeWordIdx]
    const result = new Set<CellKey>()
    for (let i = 0; i < word.word.length; i++) {
      const r = word.direction === 'down' ? word.startRow + i : word.startRow
      const c = word.direction === 'across' ? word.startCol + i : word.startCol
      result.add(ck(r, c))
    }
    return result
  }, [activeWordIdx, words])

  const acrossWords = useMemo(() =>
    words.map((w, idx) => ({ w, idx }))
      .filter(e => e.w.direction === 'across')
      .sort((a, b) => WORD_NUMS.get(a.idx)! - WORD_NUMS.get(b.idx)!),
    [words, WORD_NUMS]
  )
  const downWords = useMemo(() =>
    words.map((w, idx) => ({ w, idx }))
      .filter(e => e.w.direction === 'down')
      .sort((a, b) => WORD_NUMS.get(a.idx)! - WORD_NUMS.get(b.idx)!),
    [words, WORD_NUMS]
  )

  return (
    <div className="crossword-game">
      <div className="crossword-game-header">
        <button type="button" className="mafia-back-link" onClick={onBack}>
          ← Mavzular
        </button>
        <h1 className="crossword-title">{topicTitle.toUpperCase()}</h1>
      </div>

      {solved && (
        <div className="crossword-success">
          Tabriklaymiz! Krossvordni muvaffaqiyatli to'ldirdingiz!
        </div>
      )}

      <div className="crossword-layout">
        <div className="crossword-grid-wrap">
          <div
            className="crossword-grid"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: rows }, (_, row) =>
              Array.from({ length: cols }, (_, col) => {
                const k = ck(row, col)
                const cell = CELLS.get(k)
                if (!cell) return <div key={k} className="cw-cell cw-cell--black" />
                const val = userInput[k] ?? ''
                const isSel = selKey === k
                const isWord = activeWordCells.has(k)
                const isErr = checked && val !== '' && val !== cell.letter
                const isOk = checked && val !== '' && val === cell.letter
                return (
                  <div
                    key={k}
                    className={[
                      'cw-cell',
                      isSel && 'cw-cell--sel',
                      isWord && 'cw-cell--word',
                      isErr && 'cw-cell--err',
                      isOk && 'cw-cell--ok',
                    ].filter(Boolean).join(' ')}
                    onClick={() => handleCellClick(row, col)}
                  >
                    {cell.number !== undefined && <span className="cw-num">{cell.number}</span>}
                    <input
                      ref={el => { refs.current[k] = el }}
                      className="cw-input"
                      type="text"
                      value={val}
                      readOnly={solved}
                      onChange={e => handleChange(row, col, e)}
                      onKeyDown={e => handleKeyDown(row, col, e)}
                      onFocus={() => {
                        setSelKey(k)
                        setTimeout(() => refs.current[k]?.select(), 0)
                      }}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      aria-label={k}
                    />
                  </div>
                )
              })
            )}
          </div>

          <div className="crossword-actions">
            <button type="button" className="mafia-btn mafia-btn--primary" onClick={checkAnswers} disabled={solved}>
              Tekshirish
            </button>
            <button type="button" className="mafia-btn" onClick={revealAll} disabled={solved}>
              Javoblarni ko'rish
            </button>
            <button type="button" className="mafia-btn" onClick={resetAll}>
              Qayta boshlash
            </button>
          </div>
        </div>

        <div className="crossword-clues">
          <div className="cw-clue-section">
            <h3 className="cw-clue-heading">→ Gorizontal</h3>
            {acrossWords.map(({ w, idx }) => (
              <button
                key={idx}
                type="button"
                className={`cw-clue${activeWordIdx === idx ? ' cw-clue--active' : ''}`}
                onClick={() => doSelect(w.startRow, w.startCol, 'across')}
              >
                <span className="cw-clue-num">{WORD_NUMS.get(idx)}.</span>
                <span>{w.clue}</span>
              </button>
            ))}
          </div>
          <div className="cw-clue-section">
            <h3 className="cw-clue-heading">↓ Vertikal</h3>
            {downWords.map(({ w, idx }) => (
              <button
                key={idx}
                type="button"
                className={`cw-clue${activeWordIdx === idx ? ' cw-clue--active' : ''}`}
                onClick={() => doSelect(w.startRow, w.startCol, 'down')}
              >
                <span className="cw-clue-num">{WORD_NUMS.get(idx)}.</span>
                <span>{w.clue}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
