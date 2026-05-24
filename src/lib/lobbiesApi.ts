import { supabase } from './supabase'
import type { QuizQuestion, QuizTopic } from './quizzesApi'

export type LobbyStatus = 'waiting' | 'playing' | 'finished'

export type Lobby = {
  id: string
  code: string
  quiz_id: string
  host_id: string
  quiz_title: string
  quiz_questions: QuizQuestion[]
  time_limit_seconds: number
  status: LobbyStatus
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export type LobbyPlayer = {
  id: string
  lobby_id: string
  username: string
  is_host: boolean
  score: number
  lives: number
  question_index: number
  finished: boolean
  joined_at: string
}

export async function createLobby(
  hostId: string,
  quiz: QuizTopic,
  timeLimitSeconds: number,
  hostUsername: string,
): Promise<{ lobby: Lobby; player: LobbyPlayer }> {
  const { data: lobby, error } = await supabase
    .from('lobbies')
    .insert({
      quiz_id: quiz.id,
      host_id: hostId,
      quiz_title: quiz.title,
      quiz_questions: quiz.questions,
      time_limit_seconds: timeLimitSeconds,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  const lobbyRow = lobby as Lobby

  const { data: player, error: playerError } = await supabase
    .from('lobby_players')
    .insert({
      lobby_id: lobbyRow.id,
      username: hostUsername,
      is_host: true,
    })
    .select('*')
    .single()

  if (playerError) {
    throw playerError
  }

  return { lobby: lobbyRow, player: player as LobbyPlayer }
}

export async function findLobbyByCode(code: string): Promise<Lobby | null> {
  const { data, error } = await supabase
    .from('lobbies')
    .select('*')
    .eq('code', code.trim())
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as Lobby | null
}

export async function getLobby(id: string): Promise<Lobby | null> {
  const { data, error } = await supabase.from('lobbies').select('*').eq('id', id).maybeSingle()

  if (error) {
    throw error
  }

  return data as Lobby | null
}

export async function joinLobby(lobbyId: string, username: string): Promise<LobbyPlayer> {
  const { data, error } = await supabase
    .from('lobby_players')
    .insert({
      lobby_id: lobbyId,
      username,
      is_host: false,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as LobbyPlayer
}

export async function listPlayers(lobbyId: string): Promise<LobbyPlayer[]> {
  const { data, error } = await supabase
    .from('lobby_players')
    .select('*')
    .eq('lobby_id', lobbyId)
    .order('joined_at', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []) as LobbyPlayer[]
}

export async function leaveLobby(playerId: string): Promise<void> {
  const { error } = await supabase.from('lobby_players').delete().eq('id', playerId)

  if (error) {
    throw error
  }
}

export async function startLobby(lobbyId: string): Promise<void> {
  const { error } = await supabase
    .from('lobbies')
    .update({ status: 'playing', started_at: new Date().toISOString() })
    .eq('id', lobbyId)

  if (error) {
    throw error
  }
}

export async function finishLobby(lobbyId: string): Promise<void> {
  const { error } = await supabase
    .from('lobbies')
    .update({ status: 'finished', finished_at: new Date().toISOString() })
    .eq('id', lobbyId)

  if (error) {
    throw error
  }
}

export async function updatePlayerProgress(
  playerId: string,
  patch: Partial<Pick<LobbyPlayer, 'score' | 'lives' | 'question_index' | 'finished'>>,
): Promise<void> {
  const { error } = await supabase.from('lobby_players').update(patch).eq('id', playerId)

  if (error) {
    throw error
  }
}

type Cleanup = () => void

export function subscribeToLobby(
  lobbyId: string,
  onChange: (lobby: Lobby) => void,
): Cleanup {
  const channel = supabase
    .channel(`lobby:${lobbyId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'lobbies', filter: `id=eq.${lobbyId}` },
      (payload) => onChange(payload.new as Lobby),
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeToPlayers(
  lobbyId: string,
  onChange: (players: LobbyPlayer[]) => void,
): Cleanup {
  let current: LobbyPlayer[] = []

  const applyAndEmit = (next: LobbyPlayer[]) => {
    current = next.sort((a, b) => a.joined_at.localeCompare(b.joined_at))
    onChange(current)
  }

  // Initial fetch
  listPlayers(lobbyId)
    .then(applyAndEmit)
    .catch((err) => console.error('listPlayers error', err))

  const channel = supabase
    .channel(`lobby_players:${lobbyId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'lobby_players', filter: `lobby_id=eq.${lobbyId}` },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          applyAndEmit([...current, payload.new as LobbyPlayer])
        } else if (payload.eventType === 'UPDATE') {
          applyAndEmit(
            current.map((player) =>
              player.id === (payload.new as LobbyPlayer).id ? (payload.new as LobbyPlayer) : player,
            ),
          )
        } else if (payload.eventType === 'DELETE') {
          applyAndEmit(current.filter((player) => player.id !== (payload.old as LobbyPlayer).id))
        }
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
