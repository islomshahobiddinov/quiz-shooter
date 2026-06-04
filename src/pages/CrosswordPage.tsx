import { useState } from 'react'
import { crosswordTopics } from '../data/crosswordTopics'
import type { CrosswordTopic } from '../data/crosswordTopics'
import { generateCrossword } from '../data/crosswordGenerator'
import type { GeneratedCrossword } from '../data/crosswordGenerator'
import { CrosswordGame } from '../components/CrosswordGame'

type View = 'topics' | 'generating' | 'game'

export function CrosswordPage() {
  const [view, setView] = useState<View>('topics')
  const [activeTopic, setActiveTopic] = useState<CrosswordTopic | null>(null)
  const [crossword, setCrossword] = useState<GeneratedCrossword | null>(null)
  const [genError, setGenError] = useState(false)

  const handleSelectTopic = (topic: CrosswordTopic) => {
    setView('generating')
    setGenError(false)
    setActiveTopic(topic)
    // Generate crossword (synchronous but wrapped in setTimeout for UX)
    setTimeout(() => {
      const result = generateCrossword(topic.words)
      if (result) {
        setCrossword(result)
        setView('game')
      } else {
        setGenError(true)
        setView('topics')
      }
    }, 120)
  }

  const handleBack = () => {
    setView('topics')
    setCrossword(null)
    setActiveTopic(null)
  }

  if (view === 'generating') {
    return (
      <div className="crossword-loading">
        <span>Krossvord yaratilmoqda...</span>
      </div>
    )
  }

  if (view === 'game' && crossword && activeTopic) {
    return (
      <CrosswordGame
        crossword={crossword}
        topicTitle={activeTopic.title}
        onBack={handleBack}
      />
    )
  }

  return (
    <div className="crossword-lobby">
      <div className="topics-header">
        <h1 className="crossword-title">KROSSVORD</h1>
      </div>
      <p className="crossword-subtitle">Mavzu tanlang va dasturlash terminlarini topping</p>

      {genError && (
        <p className="crossword-gen-error">
          Krossvord yaratishda xatolik. Boshqa mavzu tanlang.
        </p>
      )}

      <div className="topic-grid">
        {crosswordTopics.map(topic => (
          <div key={topic.id} className="topic-card topic-card--public">
            <button
              type="button"
              className="topic-card-main"
              onClick={() => handleSelectTopic(topic)}
            >
              <span>{topic.title}</span>
              <small>{topic.description}</small>
              <strong>{topic.words.length} ta so'z</strong>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
