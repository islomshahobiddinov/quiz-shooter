import type { User } from '@supabase/supabase-js'
import { MafiaLobbyPage } from '../components/MafiaLobbyPage'
import type { MafiaLobby, MafiaPlayer } from '../lib/mafiaApi'

type Props = {
  user: User | null
  userLabel: string
  onCreated: (data: { lobby: MafiaLobby; player: MafiaPlayer }) => void
  onJoined: (data: { lobby: MafiaLobby; player: MafiaPlayer }) => void
}

export function MafiaPage({ user, userLabel, onCreated, onJoined }: Props) {
  return (
    <MafiaLobbyPage
      hostId={user?.id ?? null}
      defaultUsername={userLabel}
      onCreated={onCreated}
      onJoined={onJoined}
    />
  )
}
