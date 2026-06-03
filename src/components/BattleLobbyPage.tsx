import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import quizzes from '../quizzes.json'
import type { QuizTopic } from '../lib/quizzesApi'
import type { BattleLobby, BattlePlayer } from '../lib/battleApi'
import { createBattleLobby, findBattleLobbyByCode, joinBattleLobby } from '../lib/battleApi'

const publicTopics = quizzes as QuizTopic[]

type Props = {
  userLabel: string
  userId: string
  onCreated: (result: { lobby: BattleLobby; player: BattlePlayer }) => void
  onJoined: (result: { lobby: BattleLobby; player: BattlePlayer }) => void
}

type View = 'topics' | 'create' | 'join'

export function BattleLobbyPage({ userLabel, userId, onCreated, onJoined }: Props) {
  const topics = publicTopics
  const { t } = useTranslation()
  const [view, setView] = useState<View>('topics')
  const [selectedTopic, setSelectedTopic] = useState<QuizTopic | null>(null)
  const [username, setUsername] = useState(userLabel)
  const [timeLimit, setTimeLimit] = useState(180)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const goTopics = () => {
    setView('topics')
    setError('')
  }

  const handleSelectTopic = (topic: QuizTopic) => {
    if (topic.questions.length === 0) return
    setSelectedTopic(topic)
    setView('create')
    setError('')
  }

  const handleCreate = async () => {
    if (!username.trim()) { setError(t('battle.nameRequired')); return }
    if (!selectedTopic) return
    setLoading(true)
    setError('')
    try {
      const result = await createBattleLobby(userId, selectedTopic, timeLimit, username.trim())
      onCreated(result)
    } catch {
      setError(t('battle.errorOccurred'))
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (code.trim().length !== 6) { setError(t('battle.codeRequired')); return }
    if (!username.trim()) { setError(t('battle.nameRequired')); return }
    setLoading(true)
    setError('')
    try {
      const lobby = await findBattleLobbyByCode(code.trim())
      if (!lobby) { setError(t('battle.lobbyNotFound')); setLoading(false); return }
      if (lobby.status === 'finished') { setError(t('battle.lobbyFinished')); setLoading(false); return }
      if (lobby.status === 'playing') { setError(t('battle.gameStarted')); setLoading(false); return }
      const p = await joinBattleLobby(lobby.id, username.trim())
      onJoined({ lobby, player: p })
    } catch {
      setError(t('battle.errorOccurred'))
    } finally {
      setLoading(false)
    }
  }

  if (view === 'create' && selectedTopic) {
    return (
      <div className="battle-lobby-page">
        <button type="button" className="mafia-back-link" onClick={goTopics}>
          ← {t('battle.back')}
        </button>
        <div className="battle-form">
          <h2>{t('battle.createTitle')}</h2>
          <p className="battle-form-meta">
            📋 {selectedTopic.title} · {selectedTopic.questions.length} {t('battle.questions')}
          </p>

          <label className="mafia-label">
            {t('battle.yourName')}
            <input
              className="mafia-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('battle.namePlaceholder')}
              maxLength={20}
            />
          </label>

          <label className="mafia-label">
            {t('battle.timeLimit')}
            <input
              className="mafia-input"
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              min={30}
              max={3600}
            />
          </label>

          {error && <p className="mafia-error">{error}</p>}

          <div className="mafia-form-actions">
            <button
              type="button"
              className="mafia-btn mafia-btn--primary"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? t('battle.creating') : t('battle.createBtn')}
            </button>
            <button type="button" className="mafia-btn" onClick={goTopics}>
              {t('battle.backBtn')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'join') {
    return (
      <div className="battle-lobby-page">
        <button type="button" className="mafia-back-link" onClick={goTopics}>
          ← {t('battle.back')}
        </button>
        <div className="battle-form">
          <h2>{t('battle.joinTitle')}</h2>

          <label className="mafia-label">
            {t('battle.lobbyCode')}
            <input
              className="mafia-input mafia-input--code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              inputMode="numeric"
            />
          </label>

          <label className="mafia-label">
            {t('battle.yourName')}
            <input
              className="mafia-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('battle.namePlaceholder')}
              maxLength={20}
            />
          </label>

          {error && <p className="mafia-error">{error}</p>}

          <div className="mafia-form-actions">
            <button
              type="button"
              className="mafia-btn mafia-btn--primary"
              onClick={handleJoin}
              disabled={loading}
            >
              {loading ? t('battle.searching') : t('battle.joinBtn')}
            </button>
            <button type="button" className="mafia-btn" onClick={goTopics}>
              {t('battle.backBtn')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="battle-lobby-page">
      <div className="topics-header">
        <h1 className="battle-title">{t('battle.title')}</h1>
        <button
          type="button"
          className="auth-button topics-join-btn"
          onClick={() => { setView('join'); setError('') }}
        >
          {t('battle.joinLobby')}
        </button>
      </div>
      <p className="battle-subtitle">{t('battle.subtitle')}</p>

      <div className="topic-grid">
        {topics.map((topic) => (
          <div key={topic.id} className="topic-card topic-card--public">
            <button
              type="button"
              className="topic-card-main"
              onClick={() => handleSelectTopic(topic)}
            >
              <span>{topic.title}</span>
              <small>{topic.description}</small>
              <strong>
                {topic.questions.length} {t('battle.questions')}
              </strong>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
