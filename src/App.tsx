import { useEffect, useState } from 'react'
import quizzes from './quizzes.json'
import { useAuth } from './lib/useAuth'
import type { QuizTopic, UserQuiz } from './lib/quizzesApi'
import type { Lobby, LobbyPlayer } from './lib/lobbiesApi'
import { getLobby } from './lib/lobbiesApi'
import { clearLobbySession, loadLobbySession, saveLobbySession } from './lib/lobbySession'
import { MyQuizzes } from './components/MyQuizzes'
import { QuizEditor } from './components/QuizEditor'
import { Sidebar } from './components/Sidebar'
import type { SidebarView } from './components/Sidebar'
import { ShooterCanvas } from './components/ShooterCanvas'
import type { ShooterFinished, ShooterProgress } from './components/ShooterCanvas'
import { LobbyCreateDialog } from './components/LobbyCreateDialog'
import { LobbyJoinDialog } from './components/LobbyJoinDialog'
import { LobbyView } from './components/LobbyView'
import './App.css'

const topics = quizzes as QuizTopic[]

const emptyHud: ShooterProgress = {
  question: '',
  questionNumber: 1,
  score: 0,
  lives: 3,
}

function App() {
  const { session, loading: authLoading, signInWithGoogle, signOut } = useAuth()
  const user = session?.user ?? null
  const userLabel =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email ||
    ''

  const [soundEnabled, setSoundEnabled] = useState(true)

  // Solo gameplay
  const [selectedTopic, setSelectedTopic] = useState<QuizTopic | null>(null)
  const [resetSignal, setResetSignal] = useState(0)
  const [hud, setHud] = useState<ShooterProgress>(emptyHud)
  const [finished, setFinished] = useState<ShooterFinished | null>(null)

  // Main-menu UI
  const [sidebarView, setSidebarView] = useState<SidebarView>('public')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<UserQuiz | null>(null)
  const [myQuizzesRefreshKey, setMyQuizzesRefreshKey] = useState(0)

  // Lobby state
  const [createLobbyQuiz, setCreateLobbyQuiz] = useState<UserQuiz | null>(null)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [activeLobby, setActiveLobby] = useState<{ lobby: Lobby; player: LobbyPlayer } | null>(null)

  // Restore lobby session on mount (anonymous user refreshed the page)
  useEffect(() => {
    const session = loadLobbySession()
    if (!session) return
    let cancelled = false

    getLobby(session.lobbyId)
      .then((lobby) => {
        if (cancelled || !lobby) {
          if (!lobby) clearLobbySession()
          return
        }

        if (lobby.status === 'finished') {
          clearLobbySession()
          return
        }

        const restoredPlayer: LobbyPlayer = {
          id: session.playerId,
          lobby_id: session.lobbyId,
          username: session.username,
          is_host: session.isHost,
          score: 0,
          lives: 3,
          question_index: 0,
          finished: false,
          joined_at: new Date().toISOString(),
        }

        setActiveLobby({ lobby, player: restoredPlayer })
      })
      .catch(() => {
        clearLobbySession()
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setSidebarView('public')
      setEditorOpen(false)
      setEditingQuiz(null)
      setCreateLobbyQuiz(null)
    }
  }, [user])

  const startTopic = (topic: QuizTopic) => {
    setSelectedTopic(topic)
    setHud({
      question: topic.questions[0]?.q ?? '',
      questionNumber: 1,
      score: 0,
      lives: 3,
    })
    setFinished(null)
    setResetSignal((s) => s + 1)
  }

  const backToTopics = () => {
    setSelectedTopic(null)
    setHud(emptyHud)
    setFinished(null)
  }

  const restartSolo = () => {
    if (!selectedTopic) return
    setHud({
      question: selectedTopic.questions[0]?.q ?? '',
      questionNumber: 1,
      score: 0,
      lives: 3,
    })
    setFinished(null)
    setResetSignal((s) => s + 1)
  }

  const handleLobbyCreated = ({ lobby, player }: { lobby: Lobby; player: LobbyPlayer }) => {
    saveLobbySession({
      lobbyId: lobby.id,
      playerId: player.id,
      username: player.username,
      isHost: true,
    })
    setActiveLobby({ lobby, player })
    setCreateLobbyQuiz(null)
  }

  const handleLobbyJoined = ({ lobby, player }: { lobby: Lobby; player: LobbyPlayer }) => {
    saveLobbySession({
      lobbyId: lobby.id,
      playerId: player.id,
      username: player.username,
      isHost: false,
    })
    setActiveLobby({ lobby, player })
    setJoinDialogOpen(false)
  }

  const handleLobbyExit = () => {
    clearLobbySession()
    setActiveLobby(null)
  }

  const livesText = `${'♥'.repeat(Math.max(0, hud.lives))}${'♡'.repeat(Math.max(0, 3 - hud.lives))}`
  const totalQuestions = selectedTopic?.questions.length ?? 0

  // Lobby view takes over the screen entirely
  if (activeLobby) {
    return (
      <LobbyView
        lobby={activeLobby.lobby}
        player={activeLobby.player}
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled((enabled) => !enabled)}
        onExit={handleLobbyExit}
      />
    )
  }

  return (
    <main className={`quiz-shooter${selectedTopic ? ' is-playing' : ''}`}>
      <div className={`hud${selectedTopic ? '' : ' is-hidden'}`}>
        <div className="score-bar">
          <button type="button" className="topic-back" onClick={backToTopics}>
            MAVZULAR
          </button>
          <span>
            TO'G'RI: <span>{hud.score}</span>
          </span>
          <span>
            SAVOL: <span>{hud.questionNumber}</span>/{totalQuestions}
          </span>
          <span className="lives">{livesText}</span>
          <button
            type="button"
            className="sound-toggle"
            aria-label={soundEnabled ? "Ovozni o'chirish" : 'Ovozni yoqish'}
            onClick={() => setSoundEnabled((enabled) => !enabled)}
          >
            OVOZ: {soundEnabled ? 'ON' : 'OFF'}
          </button>
          {user && (
            <span className="user-chip" title={user.email ?? ''}>
              {userLabel}
            </span>
          )}
        </div>
        <div className="question-box">
          <div className="question-text">{hud.question}</div>
        </div>
      </div>

      <ShooterCanvas
        questions={selectedTopic?.questions ?? []}
        soundEnabled={soundEnabled}
        active={Boolean(selectedTopic) && !finished}
        resetSignal={resetSignal}
        onProgress={setHud}
        onFinished={setFinished}
      />

      <section className={`topic-menu${selectedTopic ? '' : ' is-visible'}${user ? ' has-sidebar' : ''}`}>
        {user && (
          <Sidebar view={sidebarView} onChange={setSidebarView} userLabel={userLabel} onSignOut={signOut} />
        )}
        <div className="topic-menu-inner">
          <div className="auth-bar">
            {!user && authLoading ? (
              <span className="auth-status">…</span>
            ) : !user ? (
              <button type="button" className="auth-button auth-button--primary" onClick={signInWithGoogle}>
                GOOGLE BILAN KIRISH
              </button>
            ) : null}
            <button type="button" className="auth-button" onClick={() => setJoinDialogOpen(true)}>
              LOBBYGA QO'SHILISH
            </button>
          </div>

          {(!user || sidebarView === 'public') && (
            <>
              <h1>Mavzuni tanlang</h1>
              <div className="topic-grid">
                {topics.map((topic) => (
                  <button key={topic.id} type="button" className="topic-card" onClick={() => startTopic(topic)}>
                    <span>{topic.title}</span>
                    <small>{topic.description}</small>
                    <strong>{topic.questions.length} ta savol</strong>
                  </button>
                ))}
              </div>
            </>
          )}

          {user && sidebarView === 'mine' && !editorOpen && (
            <MyQuizzes
              refreshKey={myQuizzesRefreshKey}
              onPlay={(quiz) => startTopic(quiz)}
              onEdit={(quiz) => {
                setEditingQuiz(quiz)
                setEditorOpen(true)
              }}
              onCreate={() => {
                setEditingQuiz(null)
                setEditorOpen(true)
              }}
              onOpenLobby={(quiz) => setCreateLobbyQuiz(quiz)}
            />
          )}

          {user && sidebarView === 'mine' && editorOpen && (
            <QuizEditor
              userId={user.id}
              existing={editingQuiz}
              onSaved={() => {
                setEditorOpen(false)
                setEditingQuiz(null)
                setMyQuizzesRefreshKey((key) => key + 1)
              }}
              onCancel={() => {
                setEditorOpen(false)
                setEditingQuiz(null)
              }}
            />
          )}
        </div>
      </section>

      <div className={`overlay${finished ? ' is-visible' : ''}`}>
        <h2>{finished?.won ? 'TUGADI! 🏆' : 'GAME OVER'}</h2>
        <p>
          {totalQuestions} dan {hud.score} ta to'g'ri javob
        </p>
        <div className="overlay-actions">
          <button type="button" onClick={restartSolo}>
            ▶ QAYTA BOSHLASH
          </button>
          <button type="button" onClick={backToTopics}>
            MAVZULAR
          </button>
        </div>
      </div>

      {user && createLobbyQuiz && (
        <LobbyCreateDialog
          hostId={user.id}
          defaultUsername={userLabel}
          quiz={createLobbyQuiz}
          onCreated={handleLobbyCreated}
          onCancel={() => setCreateLobbyQuiz(null)}
        />
      )}

      {joinDialogOpen && (
        <LobbyJoinDialog
          defaultUsername={userLabel}
          onJoined={handleLobbyJoined}
          onCancel={() => setJoinDialogOpen(false)}
        />
      )}
    </main>
  )
}

export default App
