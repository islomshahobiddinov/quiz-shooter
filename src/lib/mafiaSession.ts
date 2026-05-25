type MafiaSession = {
  lobbyId: string
  playerId: string
  username: string
  isHost: boolean
}

const KEY = 'mafia_session'

export function saveMafiaSession(s: MafiaSession): void {
  localStorage.setItem(KEY, JSON.stringify(s))
}

export function loadMafiaSession(): MafiaSession | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null')
  } catch {
    return null
  }
}

export function clearMafiaSession(): void {
  localStorage.removeItem(KEY)
}
