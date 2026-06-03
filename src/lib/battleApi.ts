import { supabase } from './supabase'
import type { QuizQuestion, QuizTopic } from './quizzesApi'

export type BattleStatus = 'waiting' | 'playing' | 'finished'
export type BattleTeam = 'a' | 'b'
export type BattleWinner = 'a' | 'b' | 'draw'

export type BattleLobby = {
  id: string
  code: string
  quiz_id: string
  quiz_title: string
  quiz_questions: QuizQuestion[]
  host_id: string | null
  status: BattleStatus
  team_a_score: number
  team_b_score: number
  rope_position: number // 0-100; 50=centre; <50 team A winning; >50 team B winning
  winner: BattleWinner | null
  time_limit_seconds: number
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export type BattlePlayer = {
  id: string
  lobby_id: string
  username: string
  is_host: boolean
  team: BattleTeam
  score: number
  lives: number
  question_index: number
  finished: boolean
  joined_at: string
}

type Cleanup = () => void

export async function createBattleLobby(
  hostId: string,
  quiz: QuizTopic,
  timeLimitSeconds: number,
  hostUsername: string,
): Promise<{ lobby: BattleLobby; player: BattlePlayer }> {
  const { data: lobby, error } = await supabase
    .from('battle_lobbies')
    .insert({
      quiz_id: quiz.id,
      host_id: hostId,
      quiz_title: quiz.title,
      quiz_questions: quiz.questions,
      time_limit_seconds: timeLimitSeconds,
    })
    .select('*')
    .single()
  if (error) throw error

  const { data: player, error: pe } = await supabase
    .from('battle_players')
    .insert({ lobby_id: (lobby as BattleLobby).id, username: hostUsername, is_host: true, team: 'a' })
    .select('*')
    .single()
  if (pe) throw pe

  return { lobby: lobby as BattleLobby, player: player as BattlePlayer }
}

export async function findBattleLobbyByCode(code: string): Promise<BattleLobby | null> {
  const { data, error } = await supabase
    .from('battle_lobbies')
    .select('*')
    .eq('code', code.trim())
    .maybeSingle()
  if (error) throw error
  return data as BattleLobby | null
}

export async function getBattleLobby(id: string): Promise<BattleLobby | null> {
  const { data, error } = await supabase
    .from('battle_lobbies')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as BattleLobby | null
}

export async function joinBattleLobby(lobbyId: string, username: string): Promise<BattlePlayer> {
  const { count } = await supabase
    .from('battle_players')
    .select('*', { count: 'exact', head: true })
    .eq('lobby_id', lobbyId)

  const team: BattleTeam = (count ?? 0) % 2 === 0 ? 'a' : 'b'

  const { data, error } = await supabase
    .from('battle_players')
    .insert({ lobby_id: lobbyId, username, is_host: false, team })
    .select('*')
    .single()
  if (error) throw error
  return data as BattlePlayer
}

export async function leaveBattleLobby(playerId: string): Promise<void> {
  const { error } = await supabase.from('battle_players').delete().eq('id', playerId)
  if (error) throw error
}

export async function listBattlePlayers(lobbyId: string): Promise<BattlePlayer[]> {
  const { data, error } = await supabase
    .from('battle_players')
    .select('*')
    .eq('lobby_id', lobbyId)
    .order('joined_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as BattlePlayer[]
}

export async function startBattleLobby(lobbyId: string): Promise<void> {
  const { error } = await supabase
    .from('battle_lobbies')
    .update({ status: 'playing', started_at: new Date().toISOString() })
    .eq('id', lobbyId)
  if (error) throw error
}

export async function finishBattleLobby(lobbyId: string, winner: BattleWinner): Promise<void> {
  const { error } = await supabase
    .from('battle_lobbies')
    .update({ status: 'finished', finished_at: new Date().toISOString(), winner })
    .eq('id', lobbyId)
  if (error) throw error
}

export async function scoreTeam(lobbyId: string, team: BattleTeam): Promise<void> {
  const { error } = await supabase.rpc('battle_team_score', {
    p_lobby_id: lobbyId,
    p_team: team,
  })
  if (error) throw error
}

export async function updateBattlePlayerProgress(
  playerId: string,
  patch: Partial<Pick<BattlePlayer, 'score' | 'lives' | 'question_index' | 'finished'>>,
): Promise<void> {
  const { error } = await supabase.from('battle_players').update(patch).eq('id', playerId)
  if (error) throw error
}

export function subscribeToBattleLobby(
  lobbyId: string,
  onChange: (lobby: BattleLobby) => void,
): Cleanup {
  const channel = supabase
    .channel(`battle_lobby:${lobbyId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'battle_lobbies', filter: `id=eq.${lobbyId}` },
      (payload) => onChange(payload.new as BattleLobby),
    )
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

export function subscribeToBattlePlayers(
  lobbyId: string,
  onChange: (players: BattlePlayer[]) => void,
): Cleanup {
  let current: BattlePlayer[] = []

  const applyAndEmit = (next: BattlePlayer[]) => {
    current = next.sort((a, b) => a.joined_at.localeCompare(b.joined_at))
    onChange(current)
  }

  listBattlePlayers(lobbyId)
    .then(applyAndEmit)
    .catch((err) => console.error('listBattlePlayers error', err))

  const channel = supabase
    .channel(`battle_players:${lobbyId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'battle_players', filter: `lobby_id=eq.${lobbyId}` },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          applyAndEmit([...current, payload.new as BattlePlayer])
        } else if (payload.eventType === 'UPDATE') {
          applyAndEmit(
            current.map((p) =>
              p.id === (payload.new as BattlePlayer).id ? (payload.new as BattlePlayer) : p,
            ),
          )
        } else if (payload.eventType === 'DELETE') {
          applyAndEmit(current.filter((p) => p.id !== (payload.old as BattlePlayer).id))
        }
      },
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}
