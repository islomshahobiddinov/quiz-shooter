import { useState, useEffect, useCallback } from 'react'
import type { MemoryTopic } from '../data/memoryTopics'

export type Difficulty = 'easy' | 'medium' | 'hard'

const PAIR_COUNT: Record<Difficulty, number> = { easy: 6, medium: 8, hard: 12 }
const GRID_COLS: Record<Difficulty, number>  = { easy: 4, medium: 4, hard: 6  }

type Card = {
  uid: number
  pairId: number
  type: 'term' | 'hint'
  content: string
  isFlipped: boolean
  isMatched: boolean
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildCards(topic: MemoryTopic, pairCount: number): Card[] {
  const selected = shuffle([...topic.pairs]).slice(0, pairCount)
  const cards: Card[] = []
  selected.forEach((pair, idx) => {
    cards.push({ uid: idx * 2,     pairId: idx, type: 'term', content: pair.term, isFlipped: false, isMatched: false })
    cards.push({ uid: idx * 2 + 1, pairId: idx, type: 'hint', content: pair.hint, isFlipped: false, isMatched: false })
  })
  return shuffle(cards)
}

type Props = {
  topic: MemoryTopic
  difficulty: Difficulty
  onBack: () => void
}

export function MemoryGame({ topic, difficulty, onBack }: Props) {
  const pairCount = PAIR_COUNT[difficulty]
  const cols = GRID_COLS[difficulty]

  const [cards, setCards] = useState<Card[]>(() => buildCards(topic, pairCount))
  const [flippedUids, setFlippedUids] = useState<number[]>([])
  const [locked, setLocked] = useState(false)
  const [moves, setMoves] = useState(0)
  const [matchedCount, setMatchedCount] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [started, setStarted] = useState(false)

  const isWon = matchedCount === pairCount

  useEffect(() => {
    if (!started || isWon) return
    const id = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [started, isWon])

  const handleClick = useCallback((uid: number) => {
    if (locked) return
    const card = cards.find(c => c.uid === uid)
    if (!card || card.isFlipped || card.isMatched) return

    if (!started) setStarted(true)

    // Flip the clicked card
    const newCards = cards.map(c => c.uid === uid ? { ...c, isFlipped: true } : c)
    setCards(newCards)

    const newFlipped = [...flippedUids, uid]
    setFlippedUids(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(m => m + 1)
      setLocked(true)

      const a = newCards.find(c => c.uid === newFlipped[0])!
      const b = newCards.find(c => c.uid === newFlipped[1])!

      if (a.pairId === b.pairId) {
        // Match — mark after short pause so user sees both
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.uid === newFlipped[0] || c.uid === newFlipped[1]
              ? { ...c, isMatched: true }
              : c
          ))
          setMatchedCount(m => m + 1)
          setFlippedUids([])
          setLocked(false)
        }, 500)
      } else {
        // No match — flip back after 900ms
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.uid === newFlipped[0] || c.uid === newFlipped[1]
              ? { ...c, isFlipped: false }
              : c
          ))
          setFlippedUids([])
          setLocked(false)
        }, 900)
      }
    }
  }, [cards, flippedUids, locked, started])

  const restart = () => {
    setCards(buildCards(topic, pairCount))
    setFlippedUids([])
    setLocked(false)
    setMoves(0)
    setMatchedCount(0)
    setElapsed(0)
    setStarted(false)
  }

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const diffLabel: Record<Difficulty, string> = { easy: 'Oson', medium: "O'rta", hard: 'Qiyin' }

  return (
    <div className="memory-game">
      <div className="memory-header">
        <button type="button" className="mafia-back-link" onClick={onBack}>
          ← Orqaga
        </button>
        <h1 className="memory-title">{topic.title}</h1>
        <span className="memory-diff-badge">{diffLabel[difficulty]}</span>
        <div className="memory-stats">
          <span>{moves} harakat</span>
          <span className="memory-timer">{fmt(elapsed)}</span>
          <span>{matchedCount}/{pairCount} juft</span>
        </div>
      </div>

      {isWon && (
        <div className="memory-won">
          Barcha {pairCount} juft topildi! 🎉 &nbsp;
          <strong>{moves}</strong> harakat · <strong>{fmt(elapsed)}</strong>
        </div>
      )}

      <div
        className="memory-grid"
        style={{ '--mem-cols': String(cols) } as React.CSSProperties}
      >
        {cards.map(card => (
          <div
            key={card.uid}
            className={[
              'mem-card',
              card.isFlipped && 'is-flipped',
              card.isMatched && 'is-matched',
            ].filter(Boolean).join(' ')}
            onClick={() => handleClick(card.uid)}
            role="button"
            tabIndex={card.isMatched || card.isFlipped ? -1 : 0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleClick(card.uid) }}
            aria-pressed={card.isFlipped}
          >
            <div className="mem-card-inner">
              <div className="mem-card-back">
                <span className="mem-card-q">?</span>
              </div>
              <div className={`mem-card-front mem-card-front--${card.type}`}>
                {card.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="memory-actions">
        <button type="button" className="mafia-btn" onClick={restart}>
          Qayta boshlash
        </button>
      </div>
    </div>
  )
}
