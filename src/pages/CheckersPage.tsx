import type { CheckersLobby, CheckersPlayer } from '../lib/checkersApi'
import type { CheckersDifficulty } from '../lib/checkersLogic'
import { CheckersLobbyPage } from '../components/CheckersLobbyPage'

type Props = {
  userLabel: string
  onCreated:  (data: { lobby: CheckersLobby; player: CheckersPlayer }) => void
  onJoined:   (data: { lobby: CheckersLobby; player: CheckersPlayer }) => void
  onBotGame:  (data: { username: string; difficulty: CheckersDifficulty }) => void
}

export function CheckersPage({ userLabel, onCreated, onJoined, onBotGame }: Props) {
  return (
    <CheckersLobbyPage
      defaultUsername={userLabel}
      onCreated={onCreated}
      onJoined={onJoined}
      onBotGame={onBotGame}
    />
  )
}
