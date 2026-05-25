import type { TttLobby, TttPlayer } from '../lib/tictactoeApi'
import type { BotDifficulty } from '../components/TicTacToeBotGame'
import { TicTacToeLobbyPage } from '../components/TicTacToeLobbyPage'

type Props = {
  userLabel: string
  onCreated: (data: { lobby: TttLobby; player: TttPlayer }) => void
  onJoined: (data: { lobby: TttLobby; player: TttPlayer }) => void
  onBotGame: (data: { username: string; difficulty: BotDifficulty }) => void
}

export function TicTacToePage({ userLabel, onCreated, onJoined, onBotGame }: Props) {
  return (
    <TicTacToeLobbyPage
      defaultUsername={userLabel}
      onCreated={onCreated}
      onJoined={onJoined}
      onBotGame={onBotGame}
    />
  )
}
