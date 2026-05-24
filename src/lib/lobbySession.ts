const KEY = 'quiz-shooter:lobby-session'

export type LobbySession = {
  lobbyId: string
  playerId: string
  username: string
  isHost: boolean
}

export function saveLobbySession(session: LobbySession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    // ignore quota / privacy mode
  }
}

export function loadLobbySession(): LobbySession | null {
  try {
    const raw = localStorage.getItem(KEY)

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as LobbySession

    if (!parsed.lobbyId || !parsed.playerId) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function clearLobbySession(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
