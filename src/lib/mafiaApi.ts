import { supabase } from './supabase'

export type MafiaRole = 'mafia' | 'citizen' | 'doctor' | 'sheriff'
export type MafiaPhase = 'night' | 'day_reveal' | 'day_vote' | null
export type MafiaStatus = 'waiting' | 'playing' | 'finished'

export type NightActions = {
  mafiaTarget?: string
  doctorTarget?: string
  sheriffTarget?: string
  sheriffShootTarget?: string
}

export type LastEvent = {
  killed: string | null
  eliminated: string | null
  sheriffTarget?: string
  sheriffIsMafia?: boolean
  sheriffKilled?: string | null
}

export type MafiaLobby = {
  id: string
  code: string
  host_id: string
  status: MafiaStatus
  phase: MafiaPhase
  round: number
  roles: Record<string, MafiaRole>
  night_actions: NightActions
  day_votes: Record<string, string>
  last_event: LastEvent
  winner: string | null
  created_at: string
  started_at: string | null
  finished_at: string | null
}

export type MafiaPlayer = {
  id: string
  lobby_id: string
  username: string
  is_host: boolean
  is_alive: boolean
  joined_at: string
}

export async function createMafiaLobby(
  hostId: string,
  hostUsername: string,
): Promise<{ lobby: MafiaLobby; player: MafiaPlayer }> {
  const { data: lobby, error } = await supabase
    .from('mafia_lobbies')
    .insert({ host_id: hostId })
    .select('*')
    .single()

  if (error) throw error

  const { data: player, error: pe } = await supabase
    .from('mafia_players')
    .insert({ lobby_id: lobby.id, username: hostUsername, is_host: true })
    .select('*')
    .single()

  if (pe) throw pe

  return { lobby: lobby as MafiaLobby, player: player as MafiaPlayer }
}

export async function findMafiaLobbyByCode(code: string): Promise<MafiaLobby | null> {
  const { data, error } = await supabase
    .from('mafia_lobbies')
    .select('*')
    .eq('code', code.trim())
    .maybeSingle()

  if (error) throw error
  return data as MafiaLobby | null
}

export async function getMafiaLobby(id: string): Promise<MafiaLobby | null> {
  const { data, error } = await supabase.from('mafia_lobbies').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as MafiaLobby | null
}

export async function kickMafiaPlayer(playerId: string): Promise<void> {
  const { error } = await supabase.from('mafia_players').delete().eq('id', playerId)
  if (error) throw error
}

export async function leaveMafiaLobby(playerId: string): Promise<void> {
  const { error } = await supabase.from('mafia_players').delete().eq('id', playerId)
  if (error) throw error
}

export async function joinMafiaLobby(lobbyId: string, username: string): Promise<MafiaPlayer> {
  const { data, error } = await supabase
    .from('mafia_players')
    .insert({ lobby_id: lobbyId, username, is_host: false })
    .select('*')
    .single()

  if (error) throw error
  return data as MafiaPlayer
}

export async function listMafiaPlayers(lobbyId: string): Promise<MafiaPlayer[]> {
  const { data, error } = await supabase
    .from('mafia_players')
    .select('*')
    .eq('lobby_id', lobbyId)
    .order('joined_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as MafiaPlayer[]
}

function assignRoles(count: number): MafiaRole[] {
  const roles: MafiaRole[] = []
  const mafiaCount = count <= 5 ? 1 : count <= 8 ? 2 : 3
  for (let i = 0; i < mafiaCount; i++) roles.push('mafia')
  roles.push('doctor')
  if (count >= 5) roles.push('sheriff')
  while (roles.length < count) roles.push('citizen')
  return roles
}

export async function startMafiaGame(
  lobbyId: string,
  players: MafiaPlayer[],
): Promise<void> {
  const roleList = assignRoles(players.length)
  const shuffled = [...players].sort(() => Math.random() - 0.5)
  const roleMap: Record<string, MafiaRole> = {}
  shuffled.forEach((p, i) => { roleMap[p.id] = roleList[i] })

  const { error } = await supabase.from('mafia_lobbies').update({
    roles: roleMap,
    status: 'playing',
    phase: 'night',
    round: 1,
    started_at: new Date().toISOString(),
  }).eq('id', lobbyId)

  if (error) throw error
}

export async function submitNightAction(
  lobbyId: string,
  role: MafiaRole | 'sheriff_shoot',
  targetId: string,
): Promise<void> {
  const patch: Record<string, string> = {}
  if (role === 'mafia') patch.mafiaTarget = targetId
  if (role === 'doctor') patch.doctorTarget = targetId
  if (role === 'sheriff') patch.sheriffTarget = targetId
  if (role === 'sheriff_shoot') patch.sheriffShootTarget = targetId

  const { error } = await supabase.rpc('merge_mafia_night_action', {
    p_lobby_id: lobbyId,
    p_patch: patch,
  })

  if (error) throw error
}

export function checkAllNightActionsReady(
  players: MafiaPlayer[],
  roles: Record<string, MafiaRole>,
  actions: NightActions,
): boolean {
  const alive = players.filter((p) => p.is_alive)
  const hasMafia = alive.some((p) => roles[p.id] === 'mafia')
  const hasDoctor = alive.some((p) => roles[p.id] === 'doctor')
  const hasSheriff = alive.some((p) => roles[p.id] === 'sheriff')

  return (
    (!hasMafia || !!actions.mafiaTarget) &&
    (!hasDoctor || !!actions.doctorTarget) &&
    (!hasSheriff || !!actions.sheriffTarget || !!actions.sheriffShootTarget)
  )
}

export function checkWinner(
  players: MafiaPlayer[],
  roles: Record<string, MafiaRole>,
): 'mafia' | 'town' | null {
  const alive = players.filter((p) => p.is_alive)
  const aliveMafia = alive.filter((p) => roles[p.id] === 'mafia').length
  const aliveTown = alive.filter((p) => roles[p.id] !== 'mafia').length
  if (aliveMafia === 0) return 'town'
  if (aliveMafia >= aliveTown) return 'mafia'
  return null
}

export async function resolveNight(
  lobbyId: string,
  players: MafiaPlayer[],
  roles: Record<string, MafiaRole>,
  actions: NightActions,
): Promise<void> {
  const killed = actions.mafiaTarget ?? null
  const saved = actions.doctorTarget ?? null
  const actuallyKilled = killed && killed !== saved ? killed : null

  const sheriffShootTarget = actions.sheriffShootTarget ?? null
  const sheriffActuallyKilled =
    sheriffShootTarget && sheriffShootTarget !== saved && sheriffShootTarget !== actuallyKilled
      ? sheriffShootTarget
      : null

  const sheriffTarget = actions.sheriffTarget ?? null
  const sheriffIsMafia = sheriffTarget ? roles[sheriffTarget] === 'mafia' : undefined

  if (actuallyKilled) {
    await supabase.from('mafia_players').update({ is_alive: false }).eq('id', actuallyKilled)
  }
  if (sheriffActuallyKilled) {
    await supabase.from('mafia_players').update({ is_alive: false }).eq('id', sheriffActuallyKilled)
  }

  const updatedPlayers = players.map((p) =>
    p.id === actuallyKilled || p.id === sheriffActuallyKilled ? { ...p, is_alive: false } : p,
  )
  const winner = checkWinner(updatedPlayers, roles)

  const lastEvent: LastEvent = {
    killed: actuallyKilled,
    eliminated: null,
    sheriffTarget: sheriffTarget ?? undefined,
    sheriffIsMafia,
    sheriffKilled: sheriffActuallyKilled,
  }

  if (winner) {
    await supabase.from('mafia_lobbies').update({
      phase: null,
      status: 'finished',
      night_actions: {},
      last_event: lastEvent,
      winner,
      finished_at: new Date().toISOString(),
    }).eq('id', lobbyId)
  } else {
    await supabase.from('mafia_lobbies').update({
      phase: 'day_reveal',
      night_actions: {},
      last_event: lastEvent,
    }).eq('id', lobbyId)
  }
}

export async function startDayVote(lobbyId: string): Promise<void> {
  const { error } = await supabase
    .from('mafia_lobbies')
    .update({ phase: 'day_vote', day_votes: {} })
    .eq('id', lobbyId)

  if (error) throw error
}

export async function castVote(
  lobbyId: string,
  voterId: string,
  targetId: string,
): Promise<void> {
  const { error } = await supabase.rpc('cast_mafia_day_vote', {
    p_lobby_id: lobbyId,
    p_voter_id: voterId,
    p_target_id: targetId,
  })

  if (error) throw error
}

export async function resolveVote(
  lobbyId: string,
  players: MafiaPlayer[],
  roles: Record<string, MafiaRole>,
  votes: Record<string, string>,
  currentRound: number,
): Promise<void> {
  const tally: Record<string, number> = {}
  for (const targetId of Object.values(votes)) {
    tally[targetId] = (tally[targetId] ?? 0) + 1
  }

  let eliminated: string | null = null
  let maxVotes = 0
  let tie = false
  for (const [id, count] of Object.entries(tally)) {
    if (count > maxVotes) { maxVotes = count; eliminated = id; tie = false }
    else if (count === maxVotes) { tie = true }
  }
  if (tie) eliminated = null

  if (eliminated) {
    await supabase.from('mafia_players').update({ is_alive: false }).eq('id', eliminated)
  }

  const updatedPlayers = players.map((p) =>
    p.id === eliminated ? { ...p, is_alive: false } : p,
  )
  const winner = checkWinner(updatedPlayers, roles)
  const lastEvent: LastEvent = { killed: null, eliminated }

  if (winner) {
    await supabase.from('mafia_lobbies').update({
      phase: null,
      status: 'finished',
      day_votes: {},
      last_event: lastEvent,
      winner,
      finished_at: new Date().toISOString(),
    }).eq('id', lobbyId)
  } else {
    await supabase.from('mafia_lobbies').update({
      phase: 'night',
      round: currentRound + 1,
      day_votes: {},
      last_event: lastEvent,
    }).eq('id', lobbyId)
  }
}

type Cleanup = () => void

export function subscribeToMafiaLobby(
  lobbyId: string,
  onChange: (lobby: MafiaLobby) => void,
): Cleanup {
  const channel = supabase
    .channel(`mafia_lobby:${lobbyId}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'mafia_lobbies',
      filter: `id=eq.${lobbyId}`,
    }, (payload) => onChange(payload.new as MafiaLobby))
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

export function subscribeToMafiaPlayers(
  lobbyId: string,
  onChange: (players: MafiaPlayer[]) => void,
): Cleanup {
  let current: MafiaPlayer[] = []

  const emit = (next: MafiaPlayer[]) => {
    current = [...next].sort((a, b) => a.joined_at.localeCompare(b.joined_at))
    onChange(current)
  }

  listMafiaPlayers(lobbyId).then(emit).catch(console.error)

  const channel = supabase
    .channel(`mafia_players:${lobbyId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'mafia_players',
      filter: `lobby_id=eq.${lobbyId}`,
    }, (payload) => {
      if (payload.eventType === 'INSERT') {
        emit([...current, payload.new as MafiaPlayer])
      } else if (payload.eventType === 'UPDATE') {
        emit(current.map((p) => p.id === (payload.new as MafiaPlayer).id ? payload.new as MafiaPlayer : p))
      } else if (payload.eventType === 'DELETE') {
        emit(current.filter((p) => p.id !== (payload.old as MafiaPlayer).id))
      }
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}
