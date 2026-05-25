import { supabase } from './supabase'
import type { Board, Color } from './checkersLogic'
import { initBoard } from './checkersLogic'

export type CheckersStatus = 'waiting' | 'playing' | 'finished'

export type CheckersLobby = {
  id: string
  code: string
  status: CheckersStatus
  board: Board
  current_color: Color
  winner: Color | null
  created_at: string
  started_at: string | null
  finished_at: string | null
}

export type CheckersPlayer = {
  id: string
  lobby_id: string
  username: string
  is_host: boolean
  color: Color
  joined_at: string
}

export async function createCheckersLobby(
  username: string,
): Promise<{ lobby: CheckersLobby; player: CheckersPlayer }> {
  const { data: lobby, error } = await supabase
    .from('checkers_lobbies')
    .insert({ board: initBoard() })
    .select('*')
    .single()
  if (error) throw error

  const { data: player, error: pe } = await supabase
    .from('checkers_players')
    .insert({ lobby_id: lobby.id, username, is_host: true, color: 'red' })
    .select('*')
    .single()
  if (pe) throw pe

  return { lobby: lobby as CheckersLobby, player: player as CheckersPlayer }
}

export async function findCheckersLobbyByCode(code: string): Promise<CheckersLobby | null> {
  const { data, error } = await supabase
    .from('checkers_lobbies')
    .select('*')
    .eq('code', code.trim())
    .maybeSingle()
  if (error) throw error
  return data as CheckersLobby | null
}

export async function getCheckersLobby(id: string): Promise<CheckersLobby | null> {
  const { data, error } = await supabase
    .from('checkers_lobbies')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as CheckersLobby | null
}

export async function joinCheckersLobby(
  lobbyId: string,
  username: string,
): Promise<CheckersPlayer> {
  const { data: player, error } = await supabase
    .from('checkers_players')
    .insert({ lobby_id: lobbyId, username, is_host: false, color: 'blue' })
    .select('*')
    .single()
  if (error) throw error

  await supabase.from('checkers_lobbies').update({
    status: 'playing',
    started_at: new Date().toISOString(),
  }).eq('id', lobbyId)

  return player as CheckersPlayer
}

export async function listCheckersPlayers(lobbyId: string): Promise<CheckersPlayer[]> {
  const { data, error } = await supabase
    .from('checkers_players')
    .select('*')
    .eq('lobby_id', lobbyId)
    .order('joined_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as CheckersPlayer[]
}

export async function makeCheckersMove(
  lobbyId: string,
  board: Board,
  nextColor: Color,
  winner: Color | null,
): Promise<void> {
  const { error } = await supabase.rpc('make_checkers_move', {
    p_lobby_id: lobbyId,
    p_board: board,
    p_next_color: nextColor,
    p_winner: winner,
  })
  if (error) throw error
}

type Cleanup = () => void

export function subscribeToCheckersLobby(
  lobbyId: string,
  onChange: (lobby: CheckersLobby) => void,
): Cleanup {
  const channel = supabase
    .channel(`checkers_lobby:${lobbyId}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'checkers_lobbies',
      filter: `id=eq.${lobbyId}`,
    }, (payload) => onChange(payload.new as CheckersLobby))
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

export function subscribeToCheckersPlayers(
  lobbyId: string,
  onChange: (players: CheckersPlayer[]) => void,
): Cleanup {
  let current: CheckersPlayer[] = []

  const emit = (next: CheckersPlayer[]) => {
    current = [...next].sort((a, b) => a.joined_at.localeCompare(b.joined_at))
    onChange(current)
  }

  listCheckersPlayers(lobbyId).then(emit).catch(console.error)

  const channel = supabase
    .channel(`checkers_players:${lobbyId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'checkers_players',
      filter: `lobby_id=eq.${lobbyId}`,
    }, (payload) => {
      if (payload.eventType === 'INSERT')
        emit([...current, payload.new as CheckersPlayer])
      else if (payload.eventType === 'UPDATE')
        emit(current.map(p => p.id === (payload.new as CheckersPlayer).id ? payload.new as CheckersPlayer : p))
      else if (payload.eventType === 'DELETE')
        emit(current.filter(p => p.id !== (payload.old as CheckersPlayer).id))
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}
