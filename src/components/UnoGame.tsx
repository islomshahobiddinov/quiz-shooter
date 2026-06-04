import { useState, useEffect } from 'react'
import type { UnoLobby, UnoPlayer } from '../lib/unoApi'
import { subscribeToUnoLobby, unoPlayCard, unoDrawCard, unoChooseColor } from '../lib/unoApi'
import type { UnoGameState, UnoCard, CardColor } from '../lib/unoGameLogic'
import { isPlayable } from '../lib/unoGameLogic'

// ─── Card rendering ───────────────────────────────────────────────

const COLOR_BG: Record<CardColor, string> = {
  red:    '#dc2626',
  yellow: '#d97706',
  green:  '#16a34a',
  blue:   '#2563eb',
  wild:   '#4c1d95',
}

const COLOR_LABEL: Record<CardColor, string> = {
  red: 'Qizil', yellow: 'Sariq', green: 'Yashil', blue: 'Ko\'k', wild: '',
}

function cardLabel(c: UnoCard): string {
  if (typeof c.value === 'number') return String(c.value)
  if (c.value === 'skip')    return '⊘'
  if (c.value === 'reverse') return '↺'
  if (c.value === 'draw2')   return '+2'
  if (c.value === 'wild')    return 'W'
  if (c.value === 'wild4')   return '+4'
  return ''
}

function Card({
  card, playable = false, small = false, onClick,
}: { card: UnoCard; playable?: boolean; small?: boolean; onClick?: () => void }) {
  const label = cardLabel(card)
  return (
    <div
      className={['uno-card', small && 'uno-card--sm', playable && 'uno-card--play'].filter(Boolean).join(' ')}
      style={{ '--uc': COLOR_BG[card.color] } as React.CSSProperties}
      onClick={playable ? onClick : undefined}
    >
      {!small && <span className="uno-c-tl">{label}</span>}
      <span className="uno-c-mid">{label}</span>
      {!small && <span className="uno-c-br">{label}</span>}
    </div>
  )
}

function CardBack({ small }: { small?: boolean }) {
  return <div className={['uno-card', 'uno-card--back', small && 'uno-card--sm'].filter(Boolean).join(' ')} />
}

// ─── Main game component ──────────────────────────────────────────

type Props = {
  initialLobby: UnoLobby
  players: UnoPlayer[]
  myPlayer: UnoPlayer
  onExit: () => void
}

export function UnoGame({ initialLobby, players, myPlayer, onExit }: Props) {
  const [lobby, setLobby] = useState(initialLobby)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const unsub = subscribeToUnoLobby(lobby.id, setLobby)
    return unsub
  }, [lobby.id])

  const gs = lobby.game_state as UnoGameState | null
  if (!gs) return <div className="uno-game"><p>O'yin holati yuklanmoqda...</p></div>

  const mySeat = myPlayer.seat
  const isMyTurn = gs.phase === 'playing' && gs.currentSeat === mySeat
  const myHand = gs.hands[mySeat] ?? []

  const act = async (fn: () => Promise<void>) => {
    if (busy) return
    setBusy(true)
    try { await fn() } catch (e) { console.error(e) } finally { setBusy(false) }
  }

  const topCard = gs.discard[gs.discard.length - 1]

  const opponents = players.filter(p => p.seat !== mySeat).sort((a, b) => a.seat - b.seat)
  const colorMap: Record<CardColor, string> = COLOR_BG

  const currentPlayerName = gs.currentSeat === mySeat
    ? 'Siz'
    : (players.find(p => p.seat === gs.currentSeat)?.username ?? `O'yinchi ${gs.currentSeat + 1}`)

  return (
    <div className="uno-game">
      {/* Header */}
      <div className="uno-header">
        <button type="button" className="mafia-back-link" onClick={onExit}>← Chiqish</button>
        <h1 className="uno-title">UNO</h1>
        {gs.message && <span className="uno-msg">{gs.message}</span>}
      </div>

      {/* Turn indicator */}
      {gs.phase !== 'finished' && (
        <div className={`uno-turn-bar${isMyTurn ? ' uno-turn-bar--mine' : ''}`}>
          <span className="uno-turn-arrow">▶</span>
          <span className="uno-turn-name">
            {isMyTurn ? 'Sizning navbatingiz' : `${currentPlayerName} navbati`}
          </span>
          <span className="uno-turn-dir">
            {gs.direction === 1 ? '↻ Soat yo\'nalishi' : '↺ Teskari'}
          </span>
        </div>
      )}

      {/* Game over banner */}
      {gs.phase === 'finished' && (
        <div className="uno-gameover">
          {gs.winner === mySeat
            ? '🏆 Siz yutdingiz!'
            : `${players.find(p => p.seat === gs.winner)?.username ?? 'Birov'} yutdi!`}
          <button type="button" className="mafia-btn" onClick={onExit}>Chiqish</button>
        </div>
      )}

      {/* Opponents */}
      <div className="uno-opponents">
        {opponents.map(op => {
          const hand = gs.hands[op.seat] ?? []
          const isActive = gs.currentSeat === op.seat && gs.phase === 'playing'
          return (
            <div key={op.seat} className={`uno-opponent${isActive ? ' is-active' : ''}`}>
              <div className="uno-op-name">
                {isActive && <span className="uno-op-turn-dot" />}
                {op.username}
                {hand.length === 1 && <span className="uno-uno-tag">UNO!</span>}
              </div>
              <div className="uno-op-cards">
                {Array.from({ length: Math.min(hand.length, 8) }, (_, i) => (
                  <CardBack key={i} small />
                ))}
                {hand.length > 8 && <span className="uno-op-extra">+{hand.length - 8}</span>}
              </div>
              <span className="uno-op-count">{hand.length} karta</span>
            </div>
          )
        })}
      </div>

      {/* Table center */}
      <div className="uno-table">
        {/* Deck */}
        <div
          className={`uno-deck${isMyTurn && gs.phase === 'playing' ? ' uno-deck--active' : ''}`}
          onClick={() => isMyTurn && act(() => unoDrawCard(lobby.id, mySeat))}
          title="Karta ol"
        >
          <CardBack />
          <span className="uno-deck-n">{gs.deck.length}</span>
        </div>

        {/* Discard */}
        <div className="uno-discard">
          {topCard && <Card card={topCard} />}
        </div>

        {/* Active color indicator */}
        <div
          className="uno-color-dot"
          style={{ background: colorMap[gs.activeColor] }}
          title={COLOR_LABEL[gs.activeColor]}
        />
      </div>

      {/* Color picker (when wild played) */}
      {gs.phase === 'choose-color' && gs.currentSeat === mySeat && (
        <div className="uno-picker">
          <p className="uno-picker-label">Rang tanlang:</p>
          <div className="uno-picker-colors">
            {(['red', 'yellow', 'green', 'blue'] as CardColor[]).map(c => (
              <button
                key={c}
                type="button"
                className="uno-picker-btn"
                style={{ background: colorMap[c] }}
                onClick={() => act(() => unoChooseColor(lobby.id, mySeat, c))}
                title={COLOR_LABEL[c]}
              />
            ))}
          </div>
        </div>
      )}

      {gs.phase === 'choose-color' && gs.currentSeat !== mySeat && (
        <div className="uno-waiting-color">
          {players.find(p => p.seat === gs.currentSeat)?.username} rang tanlayapti...
        </div>
      )}

      {/* My hand */}
      <div className="uno-my-area">
        <div className="uno-my-label">
          Sizning kartalaringiz ({myHand.length})
          {myHand.length === 1 && <span className="uno-uno-tag">UNO!</span>}
          {isMyTurn && <span className="uno-turn-tag">Sizning navbatingiz</span>}
        </div>
        <div className="uno-hand">
          {myHand.map(card => {
            const canPlay = isMyTurn && gs.phase === 'playing' && isPlayable(card, gs) && !busy
            return (
              <Card
                key={card.id}
                card={card}
                playable={canPlay}
                onClick={() => act(() => unoPlayCard(lobby.id, mySeat, card.id))}
              />
            )
          })}
        </div>
        {isMyTurn && gs.phase === 'playing' && (
          <button
            type="button"
            className="mafia-btn uno-draw-btn"
            disabled={busy}
            onClick={() => act(() => unoDrawCard(lobby.id, mySeat))}
          >
            Karta ol
          </button>
        )}
      </div>
    </div>
  )
}
