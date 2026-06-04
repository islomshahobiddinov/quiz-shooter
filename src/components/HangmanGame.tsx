import { useState, useEffect, useCallback } from 'react'
import type { HangmanTopic } from '../data/hangmanTopics'

const MAX_WRONG = 6
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function HangmanSvg({ wrongCount }: { wrongCount: number }) {
  const stroke = '#ff4455'
  const gallows = '#7fffd4'
  const w = 2.5
  return (
    <svg className="hangman-svg" viewBox="0 0 200 210" aria-hidden="true">
      {/* Gallows */}
      <line x1="20" y1="200" x2="160" y2="200" stroke={gallows} strokeWidth="3" strokeLinecap="round" />
      <line x1="55" y1="200" x2="55" y2="10"  stroke={gallows} strokeWidth="3" strokeLinecap="round" />
      <line x1="55" y1="10"  x2="130" y2="10" stroke={gallows} strokeWidth="3" strokeLinecap="round" />
      <line x1="130" y1="10" x2="130" y2="32" stroke={gallows} strokeWidth="2" strokeLinecap="round" />
      {/* Head */}
      {wrongCount >= 1 && <circle cx="130" cy="49" r="17" stroke={stroke} strokeWidth={w} fill="none" />}
      {/* Body */}
      {wrongCount >= 2 && <line x1="130" y1="66" x2="130" y2="125" stroke={stroke} strokeWidth={w} strokeLinecap="round" />}
      {/* Left arm */}
      {wrongCount >= 3 && <line x1="130" y1="82" x2="100" y2="108" stroke={stroke} strokeWidth={w} strokeLinecap="round" />}
      {/* Right arm */}
      {wrongCount >= 4 && <line x1="130" y1="82" x2="160" y2="108" stroke={stroke} strokeWidth={w} strokeLinecap="round" />}
      {/* Left leg */}
      {wrongCount >= 5 && <line x1="130" y1="125" x2="100" y2="160" stroke={stroke} strokeWidth={w} strokeLinecap="round" />}
      {/* Right leg */}
      {wrongCount >= 6 && <line x1="130" y1="125" x2="160" y2="160" stroke={stroke} strokeWidth={w} strokeLinecap="round" />}
    </svg>
  )
}

type Props = {
  topic: HangmanTopic
  onBack: () => void
}

export function HangmanGame({ topic, onBack }: Props) {
  const [entry, setEntry] = useState(() => pickRandom(topic.words))
  const [guessed, setGuessed] = useState<Set<string>>(new Set())
  const [score, setScore] = useState({ wins: 0, losses: 0 })

  const word = entry.word.toUpperCase()
  const wrongGuesses = [...guessed].filter(l => !word.includes(l))
  const wrongCount = wrongGuesses.length
  const isWon = word.split('').every(l => guessed.has(l))
  const isLost = wrongCount >= MAX_WRONG
  const isDone = isWon || isLost

  // Track score when game ends
  useEffect(() => {
    if (isWon) setScore(s => ({ ...s, wins: s.wins + 1 }))
    if (isLost) setScore(s => ({ ...s, losses: s.losses + 1 }))
  }, [isWon, isLost])

  const guess = useCallback((letter: string) => {
    if (guessed.has(letter) || isDone) return
    setGuessed(prev => new Set([...prev, letter]))
  }, [guessed, isDone])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()
      if (/^[A-Z]$/.test(key)) guess(key)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [guess])

  const nextWord = () => {
    setEntry(pickRandom(topic.words))
    setGuessed(new Set())
  }

  return (
    <div className="hangman-game">
      <div className="hangman-header">
        <button type="button" className="mafia-back-link" onClick={onBack}>
          ← Mavzular
        </button>
        <h1 className="hangman-title">{topic.title}</h1>
        <div className="hangman-score">
          <span className="hangman-score-win">✓ {score.wins}</span>
          <span className="hangman-score-sep">/</span>
          <span className="hangman-score-lose">✗ {score.losses}</span>
        </div>
      </div>

      <div className="hangman-layout">
        {/* Left: figure + word */}
        <div className="hangman-left">
          <HangmanSvg wrongCount={wrongCount} />

          <div className="hangman-word-row">
            {word.split('').map((letter, i) => (
              <span key={i} className="hangman-letter-box">
                <span className="hangman-letter-inner">
                  {guessed.has(letter) ? letter : ''}
                </span>
              </span>
            ))}
          </div>

          <p className="hangman-hint">💡 {entry.hint}</p>

          <div className="hangman-wrong-row">
            {Array.from({ length: MAX_WRONG }, (_, i) => (
              <span
                key={i}
                className={`hangman-life${i < wrongCount ? ' hangman-life--gone' : ''}`}
              />
            ))}
          </div>

          {isWon && (
            <div className="hangman-result hangman-result--win">
              To'g'ri topdingiz! 🎉
            </div>
          )}
          {isLost && (
            <div className="hangman-result hangman-result--lose">
              Yutqazdingiz! So'z: <strong>{word}</strong>
            </div>
          )}
          {isDone && (
            <button type="button" className="mafia-btn mafia-btn--primary hangman-next-btn" onClick={nextWord}>
              Keyingi so'z →
            </button>
          )}
        </div>

        {/* Right: keyboard */}
        <div className="hangman-right">
          <div className="hangman-keyboard">
            {LETTERS.map(letter => {
              const isCorrect = guessed.has(letter) && word.includes(letter)
              const isWrong   = guessed.has(letter) && !word.includes(letter)
              return (
                <button
                  key={letter}
                  type="button"
                  className={[
                    'hangman-key',
                    isCorrect && 'hangman-key--correct',
                    isWrong   && 'hangman-key--wrong',
                  ].filter(Boolean).join(' ')}
                  onClick={() => guess(letter)}
                  disabled={guessed.has(letter) || isDone}
                >
                  {letter}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
