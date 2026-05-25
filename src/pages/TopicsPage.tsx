import type { User } from '@supabase/supabase-js'
import type { QuizTopic } from '../lib/quizzesApi'

type Props = {
  user: User | null
  topics: QuizTopic[]
  onStartTopic: (topic: QuizTopic) => void
  onCreateLobby: (topic: QuizTopic) => void
  onJoinLobby: () => void
}

export function TopicsPage({ user, topics, onStartTopic, onCreateLobby, onJoinLobby }: Props) {
  return (
    <>
      <div className="topics-header">
        <h1>Mavzuni tanlang</h1>
        <button type="button" className="auth-button topics-join-btn" onClick={onJoinLobby}>
          QUIZ LOBBYGA QO'SHILISH
        </button>
      </div>
      <div className="topic-grid">
        {topics.map((topic) => (
          <div key={topic.id} className="topic-card topic-card--public">
            <button
              type="button"
              className="topic-card-main"
              onClick={() => onStartTopic(topic)}
            >
              <span>{topic.title}</span>
              <small>{topic.description}</small>
              <strong>{topic.questions.length} ta savol</strong>
            </button>
            {user && (
              <button
                type="button"
                className="topic-card-lobby"
                onClick={() => onCreateLobby(topic)}
                title="Bu test bo'yicha lobby ochish"
              >
                + LOBBY
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
