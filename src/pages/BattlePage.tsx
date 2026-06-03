import type { BattleLobby, BattlePlayer } from '../lib/battleApi'
import { BattleLobbyPage } from '../components/BattleLobbyPage'

type Props = {
  userLabel: string
  userId: string
  onCreated: (result: { lobby: BattleLobby; player: BattlePlayer }) => void
  onJoined: (result: { lobby: BattleLobby; player: BattlePlayer }) => void
}

export function BattlePage(props: Props) {
  return <BattleLobbyPage {...props} />
}
