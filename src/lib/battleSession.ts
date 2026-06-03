const KEY = 'edu-mars:battle-session'

type BattleSession = {
  lobbyId: string
  playerId: string
  username: string
  isHost: boolean
  team: 'a' | 'b'
}

export function saveBattleSession(s: BattleSession): void {
  localStorage.setItem(KEY, JSON.stringify(s))
}

export function loadBattleSession(): BattleSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as BattleSession) : null
  } catch {
    return null
  }
}

export function clearBattleSession(): void {
  localStorage.removeItem(KEY)
}
