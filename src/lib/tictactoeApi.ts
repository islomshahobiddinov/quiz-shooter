import { supabase } from './supabase'

export type TttStatus = 'waiting' | 'playing' | 'finished'
export type TttSymbol = 'X' | 'O' | ''
export type TttBoard = TttSymbol[]

export type TttLobby = {
  id: string
  code: string
  status: TttStatus
  board: TttBoard
  current_symbol: 'X' | 'O'
  winner: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
}

export type TttPlayer = {
  id: string
  lobby_id: string
  username: string
  is_host: boolean
  symbol: 'X' | 'O'
  joined_at: string
}

const EMPTY_BOARD: TttBoard = ['', '', '', '', '', '', '', '', '']

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

export function checkWinner(board: TttBoard): 'X' | 'O' | 'draw' | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as 'X' | 'O'
    }
  }
  if (board.every((cell) => cell !== '')) return 'draw'
  return null
}

export async function createTttLobby(
  username: string,
): Promise<{ lobby: TttLobby; player: TttPlayer }> {
  const { data: lobby, error } = await supabase
    .from('ttt_lobbies')
    .insert({ board: EMPTY_BOARD })
    .select('*')
    .single()
  if (error) throw error

  const { data: player, error: pe } = await supabase
    .from('ttt_players')
    .insert({ lobby_id: lobby.id, username, is_host: true, symbol: 'X' })
    .select('*')
    .single()
  if (pe) throw pe

  return { lobby: lobby as TttLobby, player: player as TttPlayer }
}

export async function findTttLobbyByCode(code: string): Promise<TttLobby | null> {
  const { data, error } = await supabase
    .from('ttt_lobbies')
    .select('*')
    .eq('code', code.trim())
    .maybeSingle()
  if (error) throw error
  return data as TttLobby | null
}

export async function getTttLobby(id: string): Promise<TttLobby | null> {
  const { data, error } = await supabase
    .from('ttt_lobbies')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as TttLobby | null
}

export async function joinTttLobby(
  lobbyId: string,
  username: string,
): Promise<TttPlayer> {
  const { data: player, error } = await supabase
    .from('ttt_players')
    .insert({ lobby_id: lobbyId, username, is_host: false, symbol: 'O' })
    .select('*')
    .single()
  if (error) throw error

  await supabase.from('ttt_lobbies').update({
    status: 'playing',
    started_at: new Date().toISOString(),
  }).eq('id', lobbyId)

  return player as TttPlayer
}

export async function listTttPlayers(lobbyId: string): Promise<TttPlayer[]> {
  const { data, error } = await supabase
    .from('ttt_players')
    .select('*')
    .eq('lobby_id', lobbyId)
    .order('joined_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as TttPlayer[]
}

export async function makeTttMove(
  lobbyId: string,
  cellIndex: number,
  symbol: 'X' | 'O',
  board: TttBoard,
): Promise<void> {
  const newBoard = [...board] as TttBoard
  newBoard[cellIndex] = symbol
  const winner = checkWinner(newBoard)
  const nextSymbol = symbol === 'X' ? 'O' : 'X'

  const { error } = await supabase.rpc('make_ttt_move', {
    p_lobby_id: lobbyId,
    p_cell_index: cellIndex,
    p_symbol: symbol,
    p_next_symbol: nextSymbol,
    p_winner: winner,
  })
  if (error) throw error
}

export async function resetTttGame(lobbyId: string): Promise<void> {
  const { error } = await supabase
    .from('ttt_lobbies')
    .update({
      board: EMPTY_BOARD,
      current_symbol: 'X',
      status: 'playing',
      winner: null,
      started_at: new Date().toISOString(),
      finished_at: null,
    })
    .eq('id', lobbyId)
  if (error) throw error
}

type Cleanup = () => void

export function subscribeToTttLobby(
  lobbyId: string,
  onChange: (lobby: TttLobby) => void,
): Cleanup {
  const channel = supabase
    .channel(`ttt_lobby:${lobbyId}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'ttt_lobbies',
      filter: `id=eq.${lobbyId}`,
    }, (payload) => onChange(payload.new as TttLobby))
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

export function subscribeToTttPlayers(
  lobbyId: string,
  onChange: (players: TttPlayer[]) => void,
): Cleanup {
  let current: TttPlayer[] = []

  const emit = (next: TttPlayer[]) => {
    current = [...next].sort((a, b) => a.joined_at.localeCompare(b.joined_at))
    onChange(current)
  }

  listTttPlayers(lobbyId).then(emit).catch(console.error)

  const channel = supabase
    .channel(`ttt_players:${lobbyId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'ttt_players',
      filter: `lobby_id=eq.${lobbyId}`,
    }, (payload) => {
      if (payload.eventType === 'INSERT') {
        emit([...current, payload.new as TttPlayer])
      } else if (payload.eventType === 'UPDATE') {
        emit(current.map((p) =>
          p.id === (payload.new as TttPlayer).id ? payload.new as TttPlayer : p,
        ))
      } else if (payload.eventType === 'DELETE') {
        emit(current.filter((p) => p.id !== (payload.old as TttPlayer).id))
      }
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}
