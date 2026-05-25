type CheckersSession = {
  lobbyId: string
  playerId: string
  username: string
  isHost: boolean
}

const KEY = 'checkers_session'

export function saveCheckersSession(s: CheckersSession): void {
  localStorage.setItem(KEY, JSON.stringify(s))
}

export function loadCheckersSession(): CheckersSession | null {
  try { return JSON.parse(localStorage.getItem(KEY) ?? 'null') }
  catch { return null }
}

export function clearCheckersSession(): void {
  localStorage.removeItem(KEY)
}
