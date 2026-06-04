const KEY = 'edu-mars:uno-session'
const PID_KEY = 'edu-mars:uno-player-id'

export type UnoSession = {
  lobbyId: string
  playerId: string
  username: string
  isHost: boolean
  seat: number
}

export function getOrCreatePlayerId(): string {
  const existing = localStorage.getItem(PID_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(PID_KEY, id)
  return id
}

export function saveUnoSession(s: UnoSession): void {
  localStorage.setItem(KEY, JSON.stringify(s))
}

export function loadUnoSession(): UnoSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as UnoSession) : null
  } catch { return null }
}

export function clearUnoSession(): void {
  localStorage.removeItem(KEY)
}
