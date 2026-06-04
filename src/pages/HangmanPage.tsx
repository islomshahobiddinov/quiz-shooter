import { useState } from 'react'
import { hangmanTopics } from '../data/hangmanTopics'
import type { HangmanTopic } from '../data/hangmanTopics'
import { HangmanGame } from '../components/HangmanGame'

export function HangmanPage() {
  const [activeTopic, setActiveTopic] = useState<HangmanTopic | null>(null)

  if (activeTopic) {
    return <HangmanGame topic={activeTopic} onBack={() => setActiveTopic(null)} />
  }

  return (
    <div className="hangman-lobby">
      <div className="topics-header">
        <h1 className="hangman-title">HANGMAN</h1>
      </div>
      <p className="hangman-subtitle">Mavzu tanlang va so'zni harfma-harf toping</p>

      <div className="topic-grid">
        {hangmanTopics.map(topic => (
          <div key={topic.id} className="topic-card topic-card--public">
            <button
              type="button"
              className="topic-card-main"
              onClick={() => setActiveTopic(topic)}
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
