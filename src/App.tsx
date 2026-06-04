import React, { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from './lib/useAuth'
import { HomePage } from './pages/HomePage'
import { MafiaGame } from './components/MafiaGame'
import type { MafiaLobby, MafiaPlayer } from './lib/mafiaApi'
import { getMafiaLobby } from './lib/mafiaApi'
import { clearMafiaSession, loadMafiaSession, saveMafiaSession } from './lib/mafiaSession'
import type { TttLobby, TttPlayer } from './lib/tictactoeApi'
import { getTttLobby } from './lib/tictactoeApi'
import { clearTttSession, loadTttSession, saveTttSession } from './lib/tictactoeSession'
import { TicTacToeGame } from './components/TicTacToeGame'
import type { BotDifficulty } from './components/TicTacToeBotGame'
import { TicTacToeBotGame } from './components/TicTacToeBotGame'
import { MafiaPage } from './pages/MafiaPage'
import { MyQuizzesPage } from './pages/MyQuizzesPage'
import { TicTacToePage } from './pages/TicTacToePage'
import type { CheckersLobby, CheckersPlayer } from './lib/checkersApi'
import { getCheckersLobby } from './lib/checkersApi'
import { clearCheckersSession, loadCheckersSession, saveCheckersSession } from './lib/checkersSession'
import type { CheckersDifficulty } from './lib/checkersLogic'
import { CheckersBotGame } from './components/CheckersBotGame'
import { CheckersGame } from './components/CheckersGame'
import { CheckersPage } from './pages/CheckersPage'
import type { BattleLobby, BattlePlayer } from './lib/battleApi'
import { getBattleLobby } from './lib/battleApi'
import { clearBattleSession, loadBattleSession, saveBattleSession } from './lib/battleSession'
import { BattleGame } from './components/BattleGame'
import { BattlePage } from './pages/BattlePage'
import { NotFoundPage } from './pages/NotFoundPage'
import './App.css'

function App() {
  const { session, loading: authLoading, signInWithGoogle, signOut } = useAuth()
  const user = session?.user ?? null
  const userLabel =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email ||
    ''

  const [soundEnabled, setSoundEnabled] = useState(true)

  // Mafia state
  const [activeMafiaLobby, setActiveMafiaLobby] = useState<{ lobby: MafiaLobby; player: MafiaPlayer } | null>(null)

  // TicTacToe state
  const [activeTttLobby, setActiveTttLobby] = useState<{ lobby: TttLobby; player: TttPlayer } | null>(null)
  const [activeBotGame, setActiveBotGame] = useState<{ username: string; difficulty: BotDifficulty } | null>(null)

  // Checkers state
  const [activeCheckersLobby, setActiveCheckersLobby] = useState<{ lobby: CheckersLobby; player: CheckersPlayer } | null>(null)
  const [activeCheckersBotGame, setActiveCheckersBotGame] = useState<{ username: string; difficulty: CheckersDifficulty } | null>(null)

  // Battle state
  const [activeBattleLobby, setActiveBattleLobby] = useState<{ lobby: BattleLobby; player: BattlePlayer } | null>(null)

  const navigate = useNavigate()

  // Restore Mafia session
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

  // Restore Checkers session
  useEffect(() => {
    const s = loadCheckersSession()
    if (!s) return
    let cancelled = false
    getCheckersLobby(s.lobbyId)
      .then((lobby) => {
        if (cancelled || !lobby) { if (!lobby) clearCheckersSession(); return }
        if (lobby.status === 'finished') { clearCheckersSession(); return }
        setActiveCheckersLobby({
          lobby,
          player: { id: s.playerId, lobby_id: s.lobbyId, username: s.username, is_host: s.isHost, color: s.isHost ? 'red' : 'blue', joined_at: new Date().toISOString() },
        })
      })
      .catch(() => clearCheckersSession())
    return () => { cancelled = true }
  }, [])

  // Restore TicTacToe session
  useEffect(() => {
    const s = loadTttSession()
    if (!s) return
    let cancelled = false
    getTttLobby(s.lobbyId)
      .then((lobby) => {
        if (cancelled || !lobby) { if (!lobby) clearTttSession(); return }
        if (lobby.status === 'finished') { clearTttSession(); return }
        setActiveTttLobby({
          lobby,
          player: { id: s.playerId, lobby_id: s.lobbyId, username: s.username, is_host: s.isHost, symbol: s.isHost ? 'X' : 'O', joined_at: new Date().toISOString() },
        })
      })
      .catch(() => clearTttSession())
    return () => { cancelled = true }
  }, [])

  // Restore Battle session
  useEffect(() => {
    const s = loadBattleSession()
    if (!s) return
    let cancelled = false
    getBattleLobby(s.lobbyId)
      .then((lobby) => {
        if (cancelled || !lobby) { if (!lobby) clearBattleSession(); return }
        if (lobby.status === 'finished') { clearBattleSession(); return }
        setActiveBattleLobby({
          lobby,
          player: { id: s.playerId, lobby_id: s.lobbyId, username: s.username, is_host: s.isHost, team: s.team, score: 0, lives: 3, question_index: 0, finished: false, joined_at: new Date().toISOString() },
        })
      })
      .catch(() => clearBattleSession())
    return () => { cancelled = true }
  }, [])

  // Mafia handlers
  const handleMafiaCreated = ({ lobby, player }: { lobby: MafiaLobby; player: MafiaPlayer }) => {
    saveMafiaSession({ lobbyId: lobby.id, playerId: player.id, username: player.username, isHost: true })
    setActiveMafiaLobby({ lobby, player })
  }
  const handleMafiaJoined = ({ lobby, player }: { lobby: MafiaLobby; player: MafiaPlayer }) => {
    saveMafiaSession({ lobbyId: lobby.id, playerId: player.id, username: player.username, isHost: false })
    setActiveMafiaLobby({ lobby, player })
  }
  const handleMafiaExit = () => { clearMafiaSession(); setActiveMafiaLobby(null) }

  // TicTacToe handlers
  const handleTttCreated = ({ lobby, player }: { lobby: TttLobby; player: TttPlayer }) => {
    saveTttSession({ lobbyId: lobby.id, playerId: player.id, username: player.username, isHost: true })
    setActiveTttLobby({ lobby, player })
  }
  const handleTttJoined = ({ lobby, player }: { lobby: TttLobby; player: TttPlayer }) => {
    saveTttSession({ lobbyId: lobby.id, playerId: player.id, username: player.username, isHost: false })
    setActiveTttLobby({ lobby, player })
  }
  const handleTttExit = () => { clearTttSession(); setActiveTttLobby(null) }
  const handleBotGame = ({ username, difficulty }: { username: string; difficulty: BotDifficulty }) => {
    setActiveBotGame({ username, difficulty })
  }

  // Checkers handlers
  const handleCheckersCreated = ({ lobby, player }: { lobby: CheckersLobby; player: CheckersPlayer }) => {
    saveCheckersSession({ lobbyId: lobby.id, playerId: player.id, username: player.username, isHost: true })
    setActiveCheckersLobby({ lobby, player })
  }
  const handleCheckersJoined = ({ lobby, player }: { lobby: CheckersLobby; player: CheckersPlayer }) => {
    saveCheckersSession({ lobbyId: lobby.id, playerId: player.id, username: player.username, isHost: false })
    setActiveCheckersLobby({ lobby, player })
  }
  const handleCheckersBotGame = ({ username, difficulty }: { username: string; difficulty: CheckersDifficulty }) => {
    setActiveCheckersBotGame({ username, difficulty })
  }

  // Battle handlers
  const handleBattleCreated = ({ lobby, player }: { lobby: BattleLobby; player: BattlePlayer }) => {
    saveBattleSession({ lobbyId: lobby.id, playerId: player.id, username: player.username, isHost: true, team: player.team })
    setActiveBattleLobby({ lobby, player })
  }
  const handleBattleJoined = ({ lobby, player }: { lobby: BattleLobby; player: BattlePlayer }) => {
    saveBattleSession({ lobbyId: lobby.id, playerId: player.id, username: player.username, isHost: false, team: player.team })
    setActiveBattleLobby({ lobby, player })
  }
  const handleBattleExit = () => { clearBattleSession(); setActiveBattleLobby(null) }

  if (authLoading) return <div className="auth-loading" />

  // Full-screen takeovers
  if (activeCheckersBotGame) {
    return (
      <CheckersBotGame
        username={activeCheckersBotGame.username}
        difficulty={activeCheckersBotGame.difficulty}
        onExit={() => setActiveCheckersBotGame(null)}
      />
    )
  }
  if (activeCheckersLobby) {
    return (
      <CheckersGame
        lobby={activeCheckersLobby.lobby}
        player={activeCheckersLobby.player}
        onExit={() => { clearCheckersSession(); setActiveCheckersLobby(null) }}
      />
    )
  }
  if (activeBotGame) {
    return (
      <TicTacToeBotGame
        username={activeBotGame.username}
        difficulty={activeBotGame.difficulty}
        onExit={() => setActiveBotGame(null)}
      />
    )
  }
  if (activeTttLobby) {
    return (
      <TicTacToeGame
        lobby={activeTttLobby.lobby}
        player={activeTttLobby.player}
        onExit={handleTttExit}
      />
    )
  }
  if (activeMafiaLobby) {
    return (
      <MafiaGame
        lobby={activeMafiaLobby.lobby}
        player={activeMafiaLobby.player}
        onExit={handleMafiaExit}
      />
    )
  }
  if (activeBattleLobby) {
    return (
      <BattleGame
        lobby={activeBattleLobby.lobby}
        player={activeBattleLobby.player}
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled((e) => !e)}
        onExit={handleBattleExit}
      />
    )
  }

  const gameRoutes = (content: React.ReactNode) => (
    <section className="topic-menu is-visible">
      <div className="topic-menu-inner">
        <button type="button" className="home-back-btn" onClick={() => navigate('/')}>
          ← Bosh sahifa
        </button>
        {content}
      </div>
    </section>
  )

  return (
    <main className="edu-mars">
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              user={user}
              userLabel={userLabel}
              onSignIn={signInWithGoogle}
              onSignOut={signOut}
            />
          }
        />
        <Route
          path="/battle"
          element={gameRoutes(
            <BattlePage
              userLabel={userLabel}
              userId={user?.id ?? 'anon'}
              onCreated={handleBattleCreated}
              onJoined={handleBattleJoined}
            />
          )}
        />
        <Route
          path="/mafia"
          element={gameRoutes(
            <MafiaPage
              user={user}
              userLabel={userLabel}
              onCreated={handleMafiaCreated}
              onJoined={handleMafiaJoined}
            />
          )}
        />
        <Route
          path="/my-quizzes"
          element={
            user
              ? gameRoutes(<MyQuizzesPage user={user} userLabel={userLabel} />)
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="/tictactoe"
          element={gameRoutes(
            <TicTacToePage
              userLabel={userLabel}
              onCreated={handleTttCreated}
              onJoined={handleTttJoined}
              onBotGame={handleBotGame}
            />
          )}
        />
        <Route
          path="/checkers"
          element={gameRoutes(
            <CheckersPage
              userLabel={userLabel}
              onCreated={handleCheckersCreated}
              onJoined={handleCheckersJoined}
              onBotGame={handleCheckersBotGame}
            />
          )}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
  )
}

export default App
