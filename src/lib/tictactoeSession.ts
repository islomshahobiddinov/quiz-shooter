type TttSession = {
  lobbyId: string
  playerId: string
  username: string
  isHost: boolean
}

const KEY = 'ttt_session'

export function saveTttSession(s: TttSession): void {
  localStorage.setItem(KEY, JSON.stringify(s))
}

export function loadTttSession(): TttSession | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null')
  } catch {
    return null
  }
}

export function clearTttSession(): void {
  localStorage.removeItem(KEY)
}
