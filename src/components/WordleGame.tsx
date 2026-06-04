import { useState, useEffect, useCallback } from 'react'
import { getDailyWord, wordleWords } from '../data/wordleWords'
import type { WordleWord } from '../data/wordleWords'

const WORD_LEN = 5
const MAX_TRIES = 6

type LetterState = 'correct' | 'present' | 'absent'
type CellState   = LetterState | 'empty' | 'tbd'

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
]

function evaluate(guess: string, target: string): LetterState[] {
  const res: LetterState[] = Array(WORD_LEN).fill('absent')
  const tArr = target.split('')
  const gArr = guess.split('')
  // Pass 1: correct
  for (let i = 0; i < WORD_LEN; i++) {
    if (gArr[i] === tArr[i]) { res[i] = 'correct'; tArr[i] = ''; gArr[i] = '' }
  }
  // Pass 2: present
  for (let i = 0; i < WORD_LEN; i++) {
    if (!gArr[i]) continue
    const j = tArr.indexOf(gArr[i])
    if (j !== -1) { res[i] = 'present'; tArr[j] = '' }
  }
  return res
}

function pickRandom(): WordleWord {
  return wordleWords[Math.floor(Math.random() * wordleWords.length)]
}

type Mode = 'daily' | 'random'

export function WordleGame() {
  const [mode, setMode] = useState<Mode>('daily')
  const [target, setTarget] = useState<WordleWord>(() => getDailyWord())
  const [guesses, setGuesses] = useState<string[]>([])
  const [evals, setEvals] = useState<LetterState[][]>([])
  const [current, setCurrent] = useState('')
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [shake, setShake] = useState(false)
  const [flip, setFlip] = useState<number | null>(null) // row index being flipped

  const letterStates = evals.reduce<Record<string, LetterState>>((acc, ev, gi) => {
    guesses[gi].split('').forEach((ch, ci) => {
      const prev = acc[ch]
      const next = ev[ci]
      if (!prev || (prev !== 'correct' && next !== 'absent')) acc[ch] = next
    })
    return acc
  }, {})

  const doShake = () => { setShake(true); setTimeout(() => setShake(false), 500) }

  const submitGuess = useCallback(() => {
    if (current.length !== WORD_LEN || status !== 'playing') return
    const ev = evaluate(current, target.word)
    const row = guesses.length
    setFlip(row)
    setTimeout(() => {
      setGuesses(prev => [...prev, current])
      setEvals(prev => [...prev, ev])
      setCurrent('')
      setFlip(null)
      if (current === target.word) {
        setStatus('won')
      } else if (guesses.length + 1 >= MAX_TRIES) {
        setStatus('lost')
      }
    }, WORD_LEN * 120 + 100)
  }, [current, guesses, target, status])

  const addLetter = useCallback((key: string) => {
    if (status !== 'playing') return
    if (key === 'ENTER') { submitGuess(); return }
    if (key === '⌫' || key === 'BACKSPACE') {
      setCurrent(p => p.slice(0, -1)); return
    }
    if (/^[A-Z]$/.test(key) && current.length < WORD_LEN) {
      setCurrent(p => p + key)
    }
  }, [status, current, submitGuess])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      addLetter(e.key.toUpperCase())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [addLetter])

  const startNew = (m: Mode) => {
    setMode(m)
    setTarget(m === 'daily' ? getDailyWord() : pickRandom())
    setGuesses([]); setEvals([]); setCurrent('')
    setStatus('playing'); setFlip(null)
  }

  // Build the 6-row grid
  const rows = Array.from({ length: MAX_TRIES }, (_, ri) => {
    if (ri < guesses.length) {
      // Submitted row
      const word = guesses[ri]
      const ev = evals[ri]
      return word.split('').map((ch, ci) => ({
        letter: ch,
        state: ev[ci] as CellState,
        flipping: flip === ri,
        delay: ci * 120,
      }))
    }
    if (ri === guesses.length && status === 'playing') {
      // Active row
      return Array.from({ length: WORD_LEN }, (_, ci) => ({
        letter: current[ci] ?? '',
        state: (current[ci] ? 'tbd' : 'empty') as CellState,
        flipping: false,
        delay: 0,
      }))
    }
    // Future row
    return Array.from({ length: WORD_LEN }, () => ({ letter: '', state: 'empty' as CellState, flipping: false, delay: 0 }))
  })

  const today = new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })

  return (
    <div className="wordle-game">
      {/* Header */}
      <div className="wordle-header">
        <h1 className="wordle-title">WORDLE</h1>
        <div className="wordle-mode-btns">
          <button
            type="button"
            className={`wordle-mode-btn${mode === 'daily' ? ' is-active' : ''}`}
            onClick={() => startNew('daily')}
          >Kunlik</button>
          <button
            type="button"
            className={`wordle-mode-btn${mode === 'random' ? ' is-active' : ''}`}
            onClick={() => startNew('random')}
          >Tasodifiy</button>
        </div>
      </div>

      {mode === 'daily' && (
        <p className="wordle-date">{today} · Dasturlash terminlari</p>
      )}

      {/* Hint */}
      <p className="wordle-hint">💡 Maslahat: {target.hint}</p>

      {/* Grid */}
      <div className={`wordle-grid${shake ? ' wordle-shake' : ''}`}>
        {rows.map((row, ri) => (
          <div key={ri} className="wordle-row">
            {row.map((cell, ci) => (
              <div
                key={ci}
                className={[
                  'wl-cell',
                  `wl-cell--${cell.state}`,
                  cell.flipping && 'wl-cell--flip',
                  cell.letter && cell.state === 'tbd' && 'wl-cell--pop',
                ].filter(Boolean).join(' ')}
                style={cell.flipping ? { animationDelay: `${cell.delay}ms` } : undefined}
              >
                {cell.letter}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Result */}
      {status === 'won' && (
        <div className="wordle-result wordle-result--win">
          Zo'r! {guesses.length} ta urinishda topdingiz 🎉
        </div>
      )}
      {status === 'lost' && (
        <div className="wordle-result wordle-result--lose">
          Yutqazdingiz. So'z: <strong>{target.word}</strong>
        </div>
      )}
      {status !== 'playing' && (
        <button type="button" className="mafia-btn mafia-btn--primary wordle-new-btn" onClick={() => startNew('random')}>
          Yangi so'z →
        </button>
      )}

      {/* Keyboard */}
      <div className="wordle-keyboard">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="wordle-kb-row">
            {row.map(key => {
              const ls = key.length === 1 ? letterStates[key] : undefined
              return (
                <button
                  key={key}
                  type="button"
                  className={[
                    'wl-key',
                    key.length > 1 && 'wl-key--wide',
                    ls && `wl-key--${ls}`,
                  ].filter(Boolean).join(' ')}
                  onClick={() => addLetter(key)}
                >
                  {key}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
