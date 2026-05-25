import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import quizzes from './quizzes.json'
import { useAuth } from './lib/useAuth'
import type { QuizTopic } from './lib/quizzesApi'
import type { Lobby, LobbyPlayer } from './lib/lobbiesApi'
import { getLobby } from './lib/lobbiesApi'
import { clearLobbySession, loadLobbySession, saveLobbySession } from './lib/lobbySession'
import { Sidebar } from './components/Sidebar'
import { ShooterCanvas } from './components/ShooterCanvas'
import type { ShooterFinished, ShooterProgress } from './components/ShooterCanvas'
import { LobbyCreateDialog } from './components/LobbyCreateDialog'
import { LobbyJoinDialog } from './components/LobbyJoinDialog'
import { LobbyView } from './components/LobbyView'
import { MafiaGame } from './components/MafiaGame'
import type { MafiaLobby, MafiaPlayer } from './lib/mafiaApi'
import { getMafiaLobby } from './lib/mafiaApi'
import { clearMafiaSession, loadMafiaSession, saveMafiaSession } from './lib/mafiaSession'
import { TopicsPage } from './pages/TopicsPage'
import { MafiaPage } from './pages/MafiaPage'
import { MyQuizzesPage } from './pages/MyQuizzesPage'
import './App.css'

const topics = quizzes as QuizTopic[]

const emptyHud: ShooterProgress = {
  question: '',
  questionNumber: 1,
  score: 0,
  lives: 3,
}

function App() {
  const { session, signInWithGoogle, signOut } = useAuth()
  const user = session?.user ?? null
  const userLabel =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email ||
    ''

  const location = useLocation()
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Solo gameplay
  const [selectedTopic, setSelectedTopic] = useState<QuizTopic | null>(null)
  const [resetSignal, setResetSignal] = useState(0)
  const [hud, setHud] = useState<ShooterProgress>(emptyHud)
  const [finished, setFinished] = useState<ShooterFinished | null>(null)

  // Quiz lobby state
  const [createLobbyQuiz, setCreateLobbyQuiz] = useState<QuizTopic | null>(null)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [activeLobby, setActiveLobby] = useState<{ lobby: Lobby; player: LobbyPlayer } | null>(null)

  // Mafia state
  const [activeMafiaLobby, setActiveMafiaLobby] = useState<{ lobby: MafiaLobby; player: MafiaPlayer } | null>(null)

  // Stop quiz when navigating away from "/"
  const prevPathRef = useRef(location.pathname)
  useEffect(() => {
    if (location.pathname !== '/' && prevPathRef.current === '/' && selectedTopic) {
      backToTopics()
    }
    prevPathRef.current = location.pathname
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Restore mafia session on mount
  useEffect(() => {
    const s = loadMafiaSession()
    if (!s) return
    let cancelled = false
    getMafiaLobby(s.lobbyId)
      .then((lobby) => {
        if (cancelled || !lobby) { if (!lobby) clearMafiaSession(); return }
        if (lobby.status === 'finished') { clearMafiaSession(); return }
        setActiveMafiaLobby({
          lobby,
          player: { id: s.playerId, lobby_id: s.lobbyId, username: s.username, is_host: s.isHost, is_alive: true, joined_at: new Date().toISOString() },
        })
      })
      .catch(() => clearMafiaSession())
    return () => { cancelled = true }
  }, [])

  // Restore quiz lobby session on mount
  useEffect(() => {
    const s = loadLobbySession()
    if (!s) return
    let cancelled = false
    getLobby(s.lobbyId)
      .then((lobby) => {
        if (cancelled || !lobby) { if (!lobby) clearLobbySession(); return }
        if (lobby.status === 'finished') { clearLobbySession(); return }
        setActiveLobby({
          lobby,
          player: { id: s.playerId, lobby_id: s.lobbyId, username: s.username, is_host: s.isHost, score: 0, lives: 3, question_index: 0, finished: false, joined_at: new Date().toISOString() },
        })
      })
      .catch(() => clearLobbySession())
    return () => { cancelled = true }
  }, [])

  // Reset navigation on logout
  useEffect(() => {
    if (!user) setCreateLobbyQuiz(null)
  }, [user])

  const startTopic = (topic: QuizTopic) => {
    setSelectedTopic(topic)
    setHud({ question: topic.questions[0]?.q ?? '', questionNumber: 1, score: 0, lives: 3 })
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
    setHud({ question: selectedTopic.questions[0]?.q ?? '', questionNumber: 1, score: 0, lives: 3 })
    setFinished(null)
    setResetSignal((s) => s + 1)
  }

  const handleLobbyCreated = ({ lobby, player }: { lobby: Lobby; player: LobbyPlayer }) => {
    saveLobbySession({ lobbyId: lobby.id, playerId: player.id, username: player.username, isHost: true })
    setActiveLobby({ lobby, player })
    setCreateLobbyQuiz(null)
  }

  const handleLobbyJoined = ({ lobby, player }: { lobby: Lobby; player: LobbyPlayer }) => {
    saveLobbySession({ lobbyId: lobby.id, playerId: player.id, username: player.username, isHost: false })
    setActiveLobby({ lobby, player })
    setJoinDialogOpen(false)
  }

  const handleMafiaCreated = ({ lobby, player }: { lobby: MafiaLobby; player: MafiaPlayer }) => {
    saveMafiaSession({ lobbyId: lobby.id, playerId: player.id, username: player.username, isHost: true })
    setActiveMafiaLobby({ lobby, player })
  }

  const handleMafiaJoined = ({ lobby, player }: { lobby: MafiaLobby; player: MafiaPlayer }) => {
    saveMafiaSession({ lobbyId: lobby.id, playerId: player.id, username: player.username, isHost: false })
    setActiveMafiaLobby({ lobby, player })
  }

  const handleMafiaExit = () => {
    clearMafiaSession()
    setActiveMafiaLobby(null)
  }

  const livesText = `${'♥'.repeat(Math.max(0, hud.lives))}${'♡'.repeat(Math.max(0, 3 - hud.lives))}`
  const totalQuestions = selectedTopic?.questions.length ?? 0

  // Full-screen takeovers (before any layout)
  if (activeMafiaLobby) {
    return (
      <MafiaGame
        lobby={activeMafiaLobby.lobby}
        player={activeMafiaLobby.player}
        onExit={handleMafiaExit}
      />
    )
  }

  if (activeLobby) {
    return (
      <LobbyView
        lobby={activeLobby.lobby}
        player={activeLobby.player}
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled((e) => !e)}
        onExit={() => { clearLobbySession(); setActiveLobby(null) }}
      />
    )
  }

  return (
    <main className={`edu-mars${selectedTopic ? ' is-playing' : ''}`}>
      {/* HUD (shown during quiz) */}
      <div className={`hud${selectedTopic ? '' : ' is-hidden'}`}>
        <div className="score-bar">
          <button type="button" className="topic-back" onClick={backToTopics}>
            MAVZULAR
          </button>
          <span>TO'G'RI: <span>{hud.score}</span></span>
          <span>SAVOL: <span>{hud.questionNumber}</span>/{totalQuestions}</span>
          <span className="lives">{livesText}</span>
          <button
            type="button"
            className="sound-toggle"
            aria-label={soundEnabled ? "Ovozni o'chirish" : 'Ovozni yoqish'}
            onClick={() => setSoundEnabled((e) => !e)}
          >
            OVOZ: {soundEnabled ? 'ON' : 'OFF'}
          </button>
          {user && (
            <span className="user-chip" title={user.email ?? ''}>{userLabel}</span>
          )}
        </div>
        <div className="question-box">
          <div className="question-text">{hud.question}</div>
        </div>
      </div>

      {/* Canvas (always behind everything) */}
      <ShooterCanvas
        questions={selectedTopic?.questions ?? []}
        soundEnabled={soundEnabled}
        active={Boolean(selectedTopic) && !finished}
        resetSignal={resetSignal}
        onProgress={setHud}
        onFinished={setFinished}
      />

      {/* Main content overlay */}
      <section className={`topic-menu${selectedTopic ? '' : ' is-visible'} has-sidebar`}>
        <Sidebar
          user={user}
          userLabel={userLabel}
          onSignIn={signInWithGoogle}
          onSignOut={signOut}
        />

        <div className="topic-menu-inner">
          {/* Page routes */}
          <Routes>
            <Route
              path="/"
              element={
                <TopicsPage
                  user={user}
                  topics={topics}
                  onStartTopic={startTopic}
                  onCreateLobby={setCreateLobbyQuiz}
                  onJoinLobby={() => setJoinDialogOpen(true)}
                />
              }
            />
            <Route
              path="/mafia"
              element={
                <MafiaPage
                  user={user}
                  userLabel={userLabel}
                  onCreated={handleMafiaCreated}
                  onJoined={handleMafiaJoined}
                />
              }
            />
            <Route
              path="/my-quizzes"
              element={
                user ? (
                  <MyQuizzesPage
                    user={user}
                    userLabel={userLabel}
                    onStartTopic={startTopic}
                    onCreateLobby={setCreateLobbyQuiz}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </section>

      {/* Solo game over overlay */}
      <div className={`overlay${finished ? ' is-visible' : ''}`}>
        <h2>{finished?.won ? 'TUGADI! 🏆' : 'GAME OVER'}</h2>
        <p>{totalQuestions} dan {hud.score} ta to'g'ri javob</p>
        <div className="overlay-actions">
          <button type="button" onClick={restartSolo}>▶ QAYTA BOSHLASH</button>
          <button type="button" onClick={backToTopics}>MAVZULAR</button>
        </div>
      </div>

      {/* Dialogs */}
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
