import { useEffect, useState } from 'react'
import { getOrCreatePlayerId, saveUnoSession, loadUnoSession, clearUnoSession } from '../lib/unoSession'
import { getUnoLobby, listUnoPlayers } from '../lib/unoApi'
import type { UnoLobby, UnoPlayer } from '../lib/unoApi'
import { UnoLobbyPage } from '../components/UnoLobbyPage'
import { UnoGame } from '../components/UnoGame'

type Props = { userLabel: string }

type View = 'lobby' | 'game'

export function UnoPage({ userLabel }: Props) {
  const playerId = getOrCreatePlayerId()
  const [view, setView] = useState<View>('lobby')
  const [lobby, setLobby] = useState<UnoLobby | null>(null)
  const [myPlayer, setMyPlayer] = useState<UnoPlayer | null>(null)
  const [players, setPlayers] = useState<UnoPlayer[]>([])

  // Restore session
  useEffect(() => {
    const s = loadUnoSession()
    if (!s) return
    let cancelled = false
    getUnoLobby(s.lobbyId).then(async l => {
      if (cancelled || !l || l.status === 'finished') { clearUnoSession(); return }
      const ps = await listUnoPlayers(l.id)
      const me = ps.find(p => p.player_id === s.playerId)
      if (!me) { clearUnoSession(); return }
      setLobby(l); setMyPlayer(me); setPlayers(ps)
      setView(l.status === 'playing' ? 'game' : 'lobby')
    }).catch(() => clearUnoSession())
    return () => { cancelled = true }
  }, [])

  const handleStarted = async (l: UnoLobby, p: UnoPlayer) => {
    saveUnoSession({ lobbyId: l.id, playerId, username: p.username, isHost: p.seat === 0, seat: p.seat })
    setLobby(l)
    setMyPlayer(p)
    try {
      const ps = await listUnoPlayers(l.id)
      setPlayers(ps)
    } catch { /* game still starts, opponents show without names */ }
    setView('game')
  }

  const handleExit = () => {
    clearUnoSession()
    setLobby(null); setMyPlayer(null); setPlayers([])
    setView('lobby')
  }

  if (view === 'game' && lobby && myPlayer) {
    return (
      <UnoGame
        initialLobby={lobby}
        players={players}
        myPlayer={myPlayer}
        onExit={handleExit}
      />
    )
  }

  return (
    <UnoLobbyPage
      playerId={playerId}
      defaultUsername={userLabel}
      onStarted={handleStarted}
    />
  )
}
