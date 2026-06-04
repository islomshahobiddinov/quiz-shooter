import { supabase } from './supabase'
import { initGame, applyPlayCard, applyDrawCard, applyChooseColor } from './unoGameLogic'
import type { UnoGameState, CardColor } from './unoGameLogic'

export type UnoLobbyStatus = 'waiting' | 'playing' | 'finished'

export type UnoLobby = {
  id: string
  code: string
  host_id: string
  status: UnoLobbyStatus
  game_state: UnoGameState | null
  max_players: number
  created_at: string
}

export type UnoPlayer = {
  id: string
  lobby_id: string
  player_id: string
  username: string
  seat: number
  joined_at: string
}

type Cleanup = () => void

// ─── Create / Join ────────────────────────────────────────────────

export async function createUnoLobby(
  playerId: string,
  username: string,
): Promise<{ lobby: UnoLobby; player: UnoPlayer }> {
  const { data: lobby, error: le } = await supabase
    .from('uno_lobbies')
    .insert({ host_id: playerId })
    .select('*')
    .single()
  if (le) throw le

  const { data: player, error: pe } = await supabase
    .from('uno_players')
    .insert({ lobby_id: (lobby as UnoLobby).id, player_id: playerId, username, seat: 0 })
    .select('*')
    .single()
  if (pe) throw pe

  return { lobby: lobby as UnoLobby, player: player as UnoPlayer }
}

export async function findUnoLobbyByCode(code: string): Promise<UnoLobby | null> {
  const { data, error } = await supabase
    .from('uno_lobbies')
    .select('*')
    .eq('code', code.trim())
    .maybeSingle()
  if (error) throw error
  return data as UnoLobby | null
}

export async function getUnoLobby(id: string): Promise<UnoLobby | null> {
  const { data, error } = await supabase
    .from('uno_lobbies')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as UnoLobby | null
}

export async function joinUnoLobby(
  lobbyId: string,
  playerId: string,
  username: string,
): Promise<UnoPlayer> {
  // Find next available seat
  const { data: existing } = await supabase
    .from('uno_players')
    .select('seat')
    .eq('lobby_id', lobbyId)
    .order('seat', { ascending: true })
  const takenSeats = (existing ?? []).map((p: { seat: number }) => p.seat)
  let seat = 0
  while (takenSeats.includes(seat)) seat++
  if (seat >= 4) throw new Error('Lobby to\'lgan (max 4 o\'yinchi)')

  const { data, error } = await supabase
    .from('uno_players')
    .insert({ lobby_id: lobbyId, player_id: playerId, username, seat })
    .select('*')
    .single()
  if (error) throw error
  return data as UnoPlayer
}

export async function listUnoPlayers(lobbyId: string): Promise<UnoPlayer[]> {
  const { data, error } = await supabase
    .from('uno_players')
    .select('*')
    .eq('lobby_id', lobbyId)
    .order('seat', { ascending: true })
  if (error) throw error
  return (data ?? []) as UnoPlayer[]
}

// ─── Game actions ─────────────────────────────────────────────────

async function fetchAndUpdate(
  lobbyId: string,
  transform: (gs: UnoGameState) => UnoGameState,
): Promise<void> {
  const { data, error } = await supabase
    .from('uno_lobbies')
    .select('game_state')
    .eq('id', lobbyId)
    .single()
  if (error || !data) throw error ?? new Error('Lobby topilmadi')

  const newGs = transform(data.game_state as UnoGameState)
  const { error: ue } = await supabase
    .from('uno_lobbies')
    .update({
      game_state: newGs,
      status: newGs.phase === 'finished' ? 'finished' : 'playing',
    })
    .eq('id', lobbyId)
  if (ue) throw ue
}

export async function startUnoGame(lobbyId: string): Promise<void> {
  const players = await listUnoPlayers(lobbyId)
  if (players.length < 2) throw new Error('Kamida 2 o\'yinchi kerak')
  const gs = initGame(players.length)
  const { error } = await supabase
    .from('uno_lobbies')
    .update({ status: 'playing', game_state: gs })
    .eq('id', lobbyId)
  if (error) throw error
}

export async function unoPlayCard(lobbyId: string, seat: number, cardId: number): Promise<void> {
  await fetchAndUpdate(lobbyId, gs => applyPlayCard(gs, seat, cardId))
}

export async function unoDrawCard(lobbyId: string, seat: number): Promise<void> {
  await fetchAndUpdate(lobbyId, gs => applyDrawCard(gs, seat))
}

export async function unoChooseColor(lobbyId: string, seat: number, color: CardColor): Promise<void> {
  await fetchAndUpdate(lobbyId, gs => applyChooseColor(gs, seat, color))
}

// ─── Realtime ─────────────────────────────────────────────────────

export function subscribeToUnoLobby(
  lobbyId: string,
  onChange: (lobby: UnoLobby) => void,
): Cleanup {
  const ch = supabase
    .channel(`uno_lobby:${lobbyId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'uno_lobbies', filter: `id=eq.${lobbyId}` },
      payload => onChange(payload.new as UnoLobby),
    )
    .subscribe()
  return () => { supabase.removeChannel(ch) }
}

export function subscribeToUnoPlayers(
  lobbyId: string,
  onChange: (players: UnoPlayer[]) => void,
): Cleanup {
  let current: UnoPlayer[] = []
  const emit = (list: UnoPlayer[]) => {
    current = list.sort((a, b) => a.seat - b.seat)
    onChange(current)
  }

  listUnoPlayers(lobbyId).then(emit).catch(console.error)

  const ch = supabase
    .channel(`uno_players:${lobbyId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'uno_players', filter: `lobby_id=eq.${lobbyId}` },
      payload => {
        if (payload.eventType === 'INSERT') emit([...current, payload.new as UnoPlayer])
        else if (payload.eventType === 'DELETE') emit(current.filter(p => p.id !== (payload.old as UnoPlayer).id))
      },
    )
    .subscribe()
  return () => { supabase.removeChannel(ch) }
}
