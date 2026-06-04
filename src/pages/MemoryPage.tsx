import { useState } from 'react'
import { memoryTopics } from '../data/memoryTopics'
import type { MemoryTopic } from '../data/memoryTopics'
import { MemoryGame } from '../components/MemoryGame'
import type { Difficulty } from '../components/MemoryGame'

type View = 'topics' | 'difficulty' | 'game'

const DIFFICULTIES: { key: Difficulty; label: string; pairs: number; desc: string }[] = [
  { key: 'easy',   label: 'Oson',   pairs: 6,  desc: '6 juft · 12 karta' },
  { key: 'medium', label: "O'rta",  pairs: 8,  desc: '8 juft · 16 karta' },
  { key: 'hard',   label: 'Qiyin',  pairs: 12, desc: '12 juft · 24 karta' },
]

export function MemoryPage() {
  const [view, setView] = useState<View>('topics')
  const [topic, setTopic] = useState<MemoryTopic | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)

  if (view === 'game' && topic && difficulty) {
    return (
      <MemoryGame
        topic={topic}
        difficulty={difficulty}
        onBack={() => setView('difficulty')}
      />
    )
  }

  if (view === 'difficulty' && topic) {
    return (
      <div className="memory-lobby">
        <button type="button" className="mafia-back-link memory-back" onClick={() => setView('topics')}>
          ← Mavzular
        </button>
        <h1 className="memory-title">{topic.title} — Qiyinlik</h1>
        <p className="memory-subtitle">Nechta juft bilan o'ynamoqchisiz?</p>
        <div className="memory-diff-grid">
          {DIFFICULTIES.map(d => (
            <button
              key={d.key}
              type="button"
              className="memory-diff-card"
              onClick={() => { setDifficulty(d.key); setView('game') }}
            >
              <span className="memory-diff-label">{d.label}</span>
              <span className="memory-diff-desc">{d.desc}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="memory-lobby">
      <div className="topics-header">
        <h1 className="memory-title">MEMORY MATCH</h1>
      </div>
      <p className="memory-subtitle">Mavzu tanlang — termini va ta'rifini juftlashtiring</p>

      <div className="topic-grid">
        {memoryTopics.map(t => (
          <div key={t.id} className="topic-card topic-card--public">
            <button
              type="button"
              className="topic-card-main"
              onClick={() => { setTopic(t); setView('difficulty') }}
            >
              <span>{t.title}</span>
              <small>{t.description}</small>
              <strong>{t.pairs.length} ta juft</strong>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
