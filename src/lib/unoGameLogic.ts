// Pure game logic — no Supabase, no React

export type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild'
export type CardValue = number | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4'

export interface UnoCard {
  id: number
  color: CardColor
  value: CardValue
}

export interface UnoGameState {
  deck: UnoCard[]
  discard: UnoCard[]
  hands: Record<string, UnoCard[]>   // key = seat number as string
  currentSeat: number
  direction: 1 | -1
  activeColor: CardColor
  phase: 'playing' | 'choose-color' | 'finished'
  winner: number | null
  message: string
  pendingWild: boolean
  pendingWildIs4: boolean
}

// ─── Utilities ────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function buildDeck(): UnoCard[] {
  let id = 0
  const cards: UnoCard[] = []
  const colors: CardColor[] = ['red', 'yellow', 'green', 'blue']
  for (const color of colors) {
    cards.push({ id: id++, color, value: 0 })
    for (let n = 1; n <= 9; n++) {
      cards.push({ id: id++, color, value: n })
      cards.push({ id: id++, color, value: n })
    }
    for (const v of ['skip', 'reverse', 'draw2'] as const) {
      cards.push({ id: id++, color, value: v })
      cards.push({ id: id++, color, value: v })
    }
  }
  for (let i = 0; i < 4; i++) {
    cards.push({ id: id++, color: 'wild', value: 'wild' })
    cards.push({ id: id++, color: 'wild', value: 'wild4' })
  }
  return shuffle(cards)
}

function drawN(state: UnoGameState, n: number): [UnoCard[], UnoGameState] {
  let deck = [...state.deck]
  let discard = [...state.discard]
  const drawn: UnoCard[] = []
  for (let i = 0; i < n; i++) {
    if (deck.length === 0) {
      if (discard.length <= 1) break
      const top = discard[discard.length - 1]
      deck = shuffle(discard.slice(0, -1))
      discard = [top]
    }
    drawn.push(deck.pop()!)
  }
  return [drawn, { ...state, deck, discard }]
}

function nextSeat(current: number, direction: 1 | -1, total: number, skip = false): number {
  let n = ((current + direction) % total + total) % total
  if (skip) n = ((n + direction) % total + total) % total
  return n
}

export function isPlayable(card: UnoCard, state: UnoGameState): boolean {
  if (card.color === 'wild') return true
  const top = state.discard[state.discard.length - 1]
  return card.color === state.activeColor || card.value === top.value
}

// ─── Game actions ─────────────────────────────────────────────────

export function initGame(seatCount: number): UnoGameState {
  let deck = buildDeck()
  const hands: Record<string, UnoCard[]> = {}
  for (let s = 0; s < seatCount; s++) {
    hands[s] = deck.splice(0, 7)
  }
  // First card: must be a number card
  let firstCard: UnoCard
  while (true) {
    const card = deck.shift()!
    if (typeof card.value === 'number') { firstCard = card; break }
    deck.push(card)
  }
  return {
    deck,
    discard: [firstCard],
    hands,
    currentSeat: 0,
    direction: 1,
    activeColor: firstCard.color as CardColor,
    phase: 'playing',
    winner: null,
    message: '',
    pendingWild: false,
    pendingWildIs4: false,
  }
}

export function applyPlayCard(state: UnoGameState, seat: number, cardId: number): UnoGameState {
  const hand = state.hands[seat] ?? []
  const card = hand.find(c => c.id === cardId)
  if (!card || !isPlayable(card, state)) return state

  const n = Object.keys(state.hands).length
  const dir = state.direction
  const nextS = nextSeat(seat, dir, n)

  let gs: UnoGameState = {
    ...state,
    hands: { ...state.hands, [seat]: hand.filter(c => c.id !== cardId) },
    discard: [...state.discard, card],
  }

  if (gs.hands[seat].length === 0) {
    return { ...gs, phase: 'finished', winner: seat, message: '' }
  }

  switch (card.value) {
    case 'skip': {
      gs.activeColor = card.color
      gs.currentSeat = nextSeat(seat, dir, n, true)
      gs.message = 'Navbat o\'tkazib yuborildi!'
      break
    }
    case 'reverse': {
      const newDir = (dir * -1) as 1 | -1
      gs.direction = newDir
      gs.activeColor = card.color
      gs.currentSeat = n === 2 ? seat : nextSeat(seat, newDir, n)
      gs.message = "Yo'nalish o'zgardi!"
      break
    }
    case 'draw2': {
      const [drawn, withDrawn] = drawN(gs, 2)
      gs = {
        ...withDrawn,
        hands: {
          ...withDrawn.hands,
          [nextS]: [...(withDrawn.hands[nextS] ?? []), ...drawn],
        },
        activeColor: card.color,
        currentSeat: nextSeat(seat, dir, n, true),
        message: '+2 karta!',
      }
      break
    }
    case 'wild': {
      gs.pendingWild = true
      gs.pendingWildIs4 = false
      gs.phase = 'choose-color'
      gs.message = 'Rang tanlanmoqda...'
      break
    }
    case 'wild4': {
      gs.pendingWild = true
      gs.pendingWildIs4 = true
      gs.phase = 'choose-color'
      gs.message = 'Rang tanlanmoqda...'
      break
    }
    default: {
      gs.activeColor = card.color
      gs.currentSeat = nextS
      gs.message = ''
    }
  }
  return gs
}

export function applyDrawCard(state: UnoGameState, seat: number): UnoGameState {
  const n = Object.keys(state.hands).length
  const [drawn, newState] = drawN(state, 1)
  if (drawn.length === 0) {
    return { ...state, currentSeat: nextSeat(seat, state.direction, n), message: 'Karta yo\'q' }
  }
  return {
    ...newState,
    hands: { ...newState.hands, [seat]: [...(newState.hands[seat] ?? []), ...drawn] },
    currentSeat: nextSeat(seat, state.direction, n),
    message: '',
  }
}

export function applyChooseColor(state: UnoGameState, seat: number, color: CardColor): UnoGameState {
  if (state.phase !== 'choose-color') return state
  const n = Object.keys(state.hands).length
  const dir = state.direction
  const nextS = nextSeat(seat, dir, n)

  if (state.pendingWildIs4) {
    const [drawn, withDrawn] = drawN(state, 4)
    return {
      ...withDrawn,
      hands: {
        ...withDrawn.hands,
        [nextS]: [...(withDrawn.hands[nextS] ?? []), ...drawn],
      },
      activeColor: color,
      currentSeat: nextSeat(seat, dir, n, true),
      phase: 'playing',
      pendingWild: false,
      pendingWildIs4: false,
      message: '+4 karta!',
    }
  }
  return {
    ...state,
    activeColor: color,
    currentSeat: nextS,
    phase: 'playing',
    pendingWild: false,
    pendingWildIs4: false,
    message: '',
  }
}
