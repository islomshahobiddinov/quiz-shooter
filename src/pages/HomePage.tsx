import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { User } from '@supabase/supabase-js'

type HomePageProps = {
  user: User | null
  userLabel: string
  onSignIn: () => void
  onSignOut: () => void
}

function IconGoogle() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M13.5 7.67c0-.46-.04-.9-.11-1.33H7.5v2.52h3.37a2.88 2.88 0 01-1.25 1.89v1.57h2.02c1.18-1.09 1.86-2.69 1.86-4.65z" fill="#4285F4"/>
      <path d="M7.5 14c1.69 0 3.1-.56 4.14-1.52l-2.02-1.57c-.56.38-1.28.6-2.12.6-1.63 0-3.01-1.1-3.5-2.58H1.9v1.62A6.5 6.5 0 007.5 14z" fill="#34A853"/>
      <path d="M4 8.93a3.9 3.9 0 010-2.46V4.85H1.9a6.5 6.5 0 000 5.7L4 8.93z" fill="#FBBC05"/>
      <path d="M7.5 2.99c.92 0 1.74.32 2.39.94l1.79-1.79A6.5 6.5 0 001.9 4.85L4 6.47c.49-1.48 1.87-2.48 3.5-2.48z" fill="#EA4335"/>
    </svg>
  )
}

function BattleSvg() {
  return (
    <svg viewBox="0 0 280 150" fill="none" aria-hidden="true" className="game-card-svg">
      <ellipse cx="140" cy="75" rx="100" ry="60" fill="rgba(255,107,53,0.06)" />
      <rect x="18" y="48" width="70" height="54" rx="8" fill="rgba(255,107,53,0.12)" stroke="rgba(255,107,53,0.4)" strokeWidth="1.5" />
      <text x="53" y="82" textAnchor="middle" fontSize="28" fontWeight="bold" fontFamily="'Courier New',monospace" fill="#ff6b35">A</text>
      <rect x="192" y="48" width="70" height="54" rx="8" fill="rgba(255,68,85,0.12)" stroke="rgba(255,68,85,0.4)" strokeWidth="1.5" />
      <text x="227" y="82" textAnchor="middle" fontSize="28" fontWeight="bold" fontFamily="'Courier New',monospace" fill="#ff4455">B</text>
      <text x="140" y="83" textAnchor="middle" fontSize="22" fontWeight="bold" fontFamily="'Courier New',monospace" fill="rgba(255,224,102,0.95)">VS</text>
      <circle cx="100" cy="75" r="3" fill="rgba(255,107,53,0.4)" />
      <circle cx="113" cy="75" r="3" fill="rgba(255,107,53,0.55)" />
      <circle cx="126" cy="75" r="3" fill="rgba(255,107,53,0.7)" />
      <circle cx="154" cy="75" r="3" fill="rgba(255,68,85,0.7)" />
      <circle cx="167" cy="75" r="3" fill="rgba(255,68,85,0.55)" />
      <circle cx="180" cy="75" r="3" fill="rgba(255,68,85,0.4)" />
      <circle cx="88" cy="32" r="2" fill="rgba(255,224,102,0.5)" />
      <circle cx="195" cy="118" r="2" fill="rgba(255,224,102,0.5)" />
      <circle cx="32" cy="118" r="1.5" fill="rgba(255,107,53,0.35)" />
      <circle cx="252" cy="30" r="1.5" fill="rgba(255,68,85,0.35)" />
      <circle cx="140" cy="18" r="1.5" fill="rgba(255,224,102,0.35)" />
    </svg>
  )
}

function MafiaSvg() {
  return (
    <svg viewBox="0 0 280 150" fill="none" aria-hidden="true" className="game-card-svg">
      <ellipse cx="140" cy="75" rx="100" ry="60" fill="rgba(255,75,104,0.05)" />
      <ellipse cx="140" cy="56" rx="42" ry="10" fill="rgba(255,75,104,0.25)" stroke="rgba(255,75,104,0.6)" strokeWidth="1.5" />
      <rect x="103" y="18" width="74" height="40" rx="6" fill="rgba(10,14,26,0.85)" stroke="rgba(255,75,104,0.55)" strokeWidth="1.5" />
      <path d="M 95 68 Q 100 130 140 133 Q 180 130 185 68" fill="rgba(10,14,26,0.9)" stroke="rgba(255,75,104,0.45)" strokeWidth="1.5" />
      <ellipse cx="120" cy="90" rx="13" ry="8" fill="rgba(255,75,104,0.08)" stroke="rgba(255,75,104,0.4)" strokeWidth="1" />
      <ellipse cx="160" cy="90" rx="13" ry="8" fill="rgba(255,75,104,0.08)" stroke="rgba(255,75,104,0.4)" strokeWidth="1" />
      <circle cx="120" cy="90" r="5" fill="#ff4b68" opacity="0.85" />
      <circle cx="160" cy="90" r="5" fill="#ff4b68" opacity="0.85" />
      <circle cx="120" cy="90" r="2.5" fill="#ff8aa0" />
      <circle cx="160" cy="90" r="2.5" fill="#ff8aa0" />
      <circle cx="56" cy="38" r="1.5" fill="rgba(255,75,104,0.4)" />
      <circle cx="228" cy="55" r="2" fill="rgba(255,75,104,0.35)" />
      <circle cx="44" cy="105" r="1" fill="rgba(255,75,104,0.3)" />
      <circle cx="240" cy="115" r="1.5" fill="rgba(255,75,104,0.3)" />
      <circle cx="230" cy="30" r="1" fill="rgba(255,75,104,0.25)" />
    </svg>
  )
}

function TttSvg() {
  return (
    <svg viewBox="0 0 280 150" fill="none" aria-hidden="true" className="game-card-svg">
      <ellipse cx="140" cy="75" rx="90" ry="55" fill="rgba(192,132,252,0.05)" />
      <line x1="110" y1="22" x2="110" y2="128" stroke="rgba(192,132,252,0.55)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="170" y1="22" x2="170" y2="128" stroke="rgba(192,132,252,0.55)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="54" y1="55" x2="226" y2="55" stroke="rgba(192,132,252,0.55)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="54" y1="95" x2="226" y2="95" stroke="rgba(192,132,252,0.55)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="64" y1="27" x2="98" y2="50" stroke="#7fffd4" strokeWidth="3" strokeLinecap="round" />
      <line x1="98" y1="27" x2="64" y2="50" stroke="#7fffd4" strokeWidth="3" strokeLinecap="round" />
      <circle cx="140" cy="38" r="13" stroke="#ffe066" strokeWidth="2.5" fill="none" />
      <line x1="180" y1="27" x2="214" y2="50" stroke="#7fffd4" strokeWidth="3" strokeLinecap="round" />
      <line x1="214" y1="27" x2="180" y2="50" stroke="#7fffd4" strokeWidth="3" strokeLinecap="round" />
      <circle cx="82" cy="75" r="13" stroke="#ffe066" strokeWidth="2.5" fill="none" />
      <line x1="120" y1="62" x2="154" y2="85" stroke="#7fffd4" strokeWidth="3" strokeLinecap="round" />
      <line x1="154" y1="62" x2="120" y2="85" stroke="#7fffd4" strokeWidth="3" strokeLinecap="round" />
      <circle cx="197" cy="75" r="13" stroke="#ffe066" strokeWidth="2.5" fill="none" />
      <circle cx="82" cy="112" r="13" stroke="#ffe066" strokeWidth="2.5" fill="none" />
      <line x1="120" y1="100" x2="154" y2="122" stroke="#7fffd4" strokeWidth="3" strokeLinecap="round" />
      <line x1="154" y1="100" x2="120" y2="122" stroke="#7fffd4" strokeWidth="3" strokeLinecap="round" />
      <line x1="64" y1="62" x2="226" y2="122" stroke="rgba(255,75,104,0.5)" strokeWidth="2" strokeLinecap="round" strokeDasharray="7,4" />
    </svg>
  )
}

function CheckersSvg() {
  const cells = []
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const dark = (r + c) % 2 === 1
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={88 + c * 28}
          y={17 + r * 28}
          width="28"
          height="28"
          fill={dark ? 'rgba(251,146,60,0.18)' : 'rgba(10,14,26,0.55)'}
        />
      )
    }
  }
  return (
    <svg viewBox="0 0 280 150" fill="none" aria-hidden="true" className="game-card-svg">
      <ellipse cx="140" cy="75" rx="90" ry="55" fill="rgba(251,146,60,0.05)" />
      {cells}
      <rect x="88" y="17" width="112" height="112" stroke="rgba(251,146,60,0.5)" strokeWidth="1.5" fill="none" />
      <circle cx="102" cy="31" r="10" fill="rgba(239,68,68,0.85)" stroke="#ef4444" strokeWidth="1.5" />
      <circle cx="158" cy="31" r="10" fill="rgba(239,68,68,0.85)" stroke="#ef4444" strokeWidth="1.5" />
      <circle cx="130" cy="59" r="10" fill="rgba(239,68,68,0.6)" stroke="#ef4444" strokeWidth="1.5" />
      <circle cx="102" cy="117" r="10" fill="rgba(96,165,250,0.85)" stroke="#60a5fa" strokeWidth="1.5" />
      <circle cx="158" cy="117" r="10" fill="rgba(96,165,250,0.85)" stroke="#60a5fa" strokeWidth="1.5" />
      <circle cx="130" cy="89" r="10" fill="rgba(96,165,250,0.6)" stroke="#60a5fa" strokeWidth="1.5" />
      <circle cx="186" cy="59" r="10" fill="rgba(239,68,68,0.45)" stroke="#ef4444" strokeWidth="1" />
      <circle cx="186" cy="89" r="10" fill="rgba(96,165,250,0.45)" stroke="#60a5fa" strokeWidth="1" />
    </svg>
  )
}

function UnoSvg() {
  return (
    <svg viewBox="0 0 280 150" fill="none" aria-hidden="true" className="game-card-svg">
      <ellipse cx="140" cy="75" rx="95" ry="58" fill="rgba(220,38,38,0.05)" />
      {/* Cards fanned out */}
      {[
        { x: 80,  y: 22, rot: -18, bg: '#dc2626', label: '7' },
        { x: 105, y: 15, rot: -8,  bg: '#d97706', label: '+2' },
        { x: 132, y: 12, rot: 0,   bg: '#16a34a', label: '↺' },
        { x: 159, y: 15, rot: 8,   bg: '#2563eb', label: 'W' },
        { x: 184, y: 22, rot: 18,  bg: '#4c1d95', label: '+4' },
      ].map((c, i) => (
        <g key={i} transform={`rotate(${c.rot} ${c.x + 17} 100)`}>
          <rect x={c.x} y={c.y} width="34" height="50" rx="5" fill={c.bg} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          <text x={c.x + 17} y={c.y + 30} textAnchor="middle" fontSize="13" fontWeight="bold"
            fontFamily="'Courier New',monospace" fill="white">{c.label}</text>
        </g>
      ))}
      {/* UNO badge */}
      <rect x="106" y="98" width="68" height="28" rx="6" fill="#dc2626" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <text x="140" y="117" textAnchor="middle" fontSize="16" fontWeight="bold"
        fontFamily="'Courier New',monospace" fill="white" letterSpacing="3">UNO</text>
      <circle cx="42"  cy="45"  r="2"   fill="rgba(220,38,38,0.4)" />
      <circle cx="240" cy="110" r="1.5" fill="rgba(220,38,38,0.35)" />
    </svg>
  )
}

function MemoryMatchSvg() {
  const cards = [
    { x: 42,  y: 20, matched: true  },
    { x: 96,  y: 20, matched: false },
    { x: 150, y: 20, matched: true  },
    { x: 204, y: 20, matched: false },
    { x: 42,  y: 78, matched: false },
    { x: 96,  y: 78, matched: true  },
    { x: 150, y: 78, matched: false },
    { x: 204, y: 78, matched: true  },
  ]
  return (
    <svg viewBox="0 0 280 150" fill="none" aria-hidden="true" className="game-card-svg">
      <ellipse cx="140" cy="75" rx="100" ry="58" fill="rgba(167,139,250,0.05)" />
      {cards.map((c, i) => (
        <g key={i}>
          <rect
            x={c.x} y={c.y} width="38" height="50" rx="5"
            fill={c.matched ? 'rgba(167,139,250,0.12)' : 'rgba(167,139,250,0.05)'}
            stroke={c.matched ? 'rgba(167,139,250,0.6)' : 'rgba(167,139,250,0.25)'}
            strokeWidth="1.5"
          />
          {c.matched ? (
            <text
              x={c.x + 19} y={c.y + 30}
              textAnchor="middle" fontSize="14" fontWeight="bold"
              fontFamily="'Courier New',monospace"
              fill="rgba(167,139,250,0.9)"
            >
              {['JS', 'C+', 'JS', 'C+'][i % 4]}
            </text>
          ) : (
            <text
              x={c.x + 19} y={c.y + 30}
              textAnchor="middle" fontSize="20" fontWeight="bold"
              fontFamily="'Courier New',monospace"
              fill="rgba(167,139,250,0.3)"
            >?</text>
          )}
        </g>
      ))}
      <circle cx="30"  cy="135" r="1.5" fill="rgba(167,139,250,0.3)" />
      <circle cx="250" cy="15"  r="2"   fill="rgba(167,139,250,0.3)" />
    </svg>
  )
}

function HangmanSvg() {
  return (
    <svg viewBox="0 0 280 150" fill="none" aria-hidden="true" className="game-card-svg">
      <ellipse cx="140" cy="75" rx="90" ry="55" fill="rgba(250,204,21,0.05)" />
      {/* Gallows */}
      <line x1="60" y1="135" x2="140" y2="135" stroke="rgba(250,204,21,0.6)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="80"  y1="135" x2="80"  y2="20"  stroke="rgba(250,204,21,0.6)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="80"  y1="20"  x2="160" y2="20"  stroke="rgba(250,204,21,0.6)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="160" y1="20"  x2="160" y2="38"  stroke="rgba(250,204,21,0.5)" strokeWidth="2"   strokeLinecap="round" />
      {/* Figure */}
      <circle cx="160" cy="52" r="14" stroke="#ff4455" strokeWidth="2.5" fill="none" />
      <line x1="160" y1="66"  x2="160" y2="100" stroke="#ff4455" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="160" y1="78"  x2="142" y2="92"  stroke="#ff4455" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="160" y1="78"  x2="178" y2="92"  stroke="#ff4455" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="160" y1="100" x2="142" y2="120" stroke="#ff4455" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="160" y1="100" x2="178" y2="120" stroke="#ff4455" strokeWidth="2.5" strokeLinecap="round" />
      {/* Letter blanks */}
      <line x1="38" y1="105" x2="52" y2="105" stroke="rgba(250,204,21,0.7)" strokeWidth="2" strokeLinecap="round" />
      <line x1="56" y1="105" x2="70" y2="105" stroke="rgba(250,204,21,0.7)" strokeWidth="2" strokeLinecap="round" />
      <line x1="74" y1="105" x2="88" y2="105" stroke="rgba(250,204,21,0.3)" strokeWidth="2" strokeLinecap="round" />
      <line x1="92" y1="105" x2="106" y2="105" stroke="rgba(250,204,21,0.7)" strokeWidth="2" strokeLinecap="round" />
      <text x="41"  y="102" fontSize="11" fontWeight="bold" fontFamily="'Courier New',monospace" fill="rgba(250,204,21,0.9)">H</text>
      <text x="59"  y="102" fontSize="11" fontWeight="bold" fontFamily="'Courier New',monospace" fill="rgba(250,204,21,0.9)">O</text>
      <text x="93"  y="102" fontSize="11" fontWeight="bold" fontFamily="'Courier New',monospace" fill="rgba(250,204,21,0.9)">K</text>
      <circle cx="230" cy="40" r="2"   fill="rgba(250,204,21,0.3)" />
      <circle cx="48"  cy="55" r="1.5" fill="rgba(250,204,21,0.25)" />
    </svg>
  )
}

function CrosswordSvg() {
  return (
    <svg viewBox="0 0 280 150" fill="none" aria-hidden="true" className="game-card-svg">
      <ellipse cx="140" cy="75" rx="90" ry="55" fill="rgba(96,212,160,0.05)" />
      {[0,1,2,3,4].map(r =>
        [0,1,2,3,4].map(c => {
          const black = (r === 0 && c === 3) || (r === 0 && c === 4) || (r === 4 && c === 0) || (r === 4 && c === 1) || (r === 2 && c === 2)
          return (
            <rect key={`${r}-${c}`}
              x={84 + c * 24} y={18 + r * 24}
              width="23" height="23"
              fill={black ? 'rgba(10,14,26,0.9)' : 'rgba(96,212,160,0.08)'}
              stroke="rgba(96,212,160,0.3)" strokeWidth="1"
            />
          )
        })
      )}
      <text x="96" y="34" fontSize="11" fontWeight="bold" fontFamily="'Courier New',monospace" fill="rgba(96,212,160,0.9)">A</text>
      <text x="120" y="34" fontSize="11" fontWeight="bold" fontFamily="'Courier New',monospace" fill="rgba(96,212,160,0.9)">R</text>
      <text x="144" y="34" fontSize="11" fontWeight="bold" fontFamily="'Courier New',monospace" fill="rgba(96,212,160,0.9)">R</text>
      <text x="96" y="58" fontSize="11" fontWeight="bold" fontFamily="'Courier New',monospace" fill="rgba(96,212,160,0.7)">R</text>
      <text x="96" y="82" fontSize="11" fontWeight="bold" fontFamily="'Courier New',monospace" fill="rgba(96,212,160,0.9)">L</text>
      <text x="120" y="82" fontSize="11" fontWeight="bold" fontFamily="'Courier New',monospace" fill="rgba(96,212,160,0.9)">O</text>
      <text x="144" y="82" fontSize="11" fontWeight="bold" fontFamily="'Courier New',monospace" fill="rgba(255,224,102,0.9)">O</text>
      <text x="168" y="82" fontSize="11" fontWeight="bold" fontFamily="'Courier New',monospace" fill="rgba(96,212,160,0.9)">P</text>
      <text x="96" y="106" fontSize="11" fontWeight="bold" fontFamily="'Courier New',monospace" fill="rgba(96,212,160,0.7)">A</text>
      <text x="96" y="130" fontSize="11" fontWeight="bold" fontFamily="'Courier New',monospace" fill="rgba(96,212,160,0.7)">Y</text>
      <circle cx="232" cy="40" r="2" fill="rgba(96,212,160,0.35)" />
      <circle cx="248" cy="110" r="1.5" fill="rgba(96,212,160,0.3)" />
      <circle cx="44" cy="60" r="2" fill="rgba(96,212,160,0.3)" />
      <circle cx="56" cy="120" r="1.5" fill="rgba(96,212,160,0.25)" />
    </svg>
  )
}

function MyQuizzesSvg() {
  return (
    <svg viewBox="0 0 280 150" fill="none" aria-hidden="true" className="game-card-svg">
      <ellipse cx="140" cy="75" rx="90" ry="55" fill="rgba(127,255,212,0.05)" />
      <rect x="85" y="20" width="90" height="110" rx="8" fill="rgba(127,255,212,0.06)" stroke="rgba(127,255,212,0.3)" strokeWidth="1.5" />
      <line x1="101" y1="48" x2="159" y2="48" stroke="rgba(127,255,212,0.5)" strokeWidth="2" strokeLinecap="round" />
      <line x1="101" y1="63" x2="149" y2="63" stroke="rgba(127,255,212,0.35)" strokeWidth="2" strokeLinecap="round" />
      <line x1="101" y1="78" x2="155" y2="78" stroke="rgba(127,255,212,0.5)" strokeWidth="2" strokeLinecap="round" />
      <line x1="101" y1="93" x2="143" y2="93" stroke="rgba(127,255,212,0.35)" strokeWidth="2" strokeLinecap="round" />
      <line x1="101" y1="108" x2="152" y2="108" stroke="rgba(127,255,212,0.5)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="94" cy="48" r="3" fill="rgba(127,255,212,0.6)" />
      <circle cx="94" cy="63" r="3" fill="rgba(127,255,212,0.4)" />
      <circle cx="94" cy="78" r="3" fill="rgba(127,255,212,0.6)" />
      <circle cx="94" cy="93" r="3" fill="rgba(127,255,212,0.4)" />
      <circle cx="94" cy="108" r="3" fill="rgba(127,255,212,0.6)" />
      <circle cx="195" cy="40" r="18" fill="rgba(127,255,212,0.08)" stroke="rgba(127,255,212,0.4)" strokeWidth="1.5" />
      <line x1="207" y1="52" x2="218" y2="63" stroke="rgba(127,255,212,0.5)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="44" cy="55" r="1.5" fill="rgba(127,255,212,0.3)" />
      <circle cx="238" cy="110" r="2" fill="rgba(127,255,212,0.3)" />
    </svg>
  )
}

const GAMES = [
  {
    key: 'battle',
    titleKey: 'nav.battle',
    descKey: 'home.battleDesc',
    route: '/battle',
    color: '#ff6b35',
    border: 'rgba(255,107,53,0.45)',
    bg: 'rgba(255,107,53,0.07)',
    svg: <BattleSvg />,
  },
  {
    key: 'mafia',
    titleKey: 'nav.mafiaGame',
    descKey: 'home.mafiaDesc',
    route: '/mafia',
    color: '#ff4b68',
    border: 'rgba(255,75,104,0.45)',
    bg: 'rgba(255,75,104,0.07)',
    svg: <MafiaSvg />,
  },
  {
    key: 'tictactoe',
    titleKey: 'nav.tictactoe',
    descKey: 'home.tttDesc',
    route: '/tictactoe',
    color: '#c084fc',
    border: 'rgba(192,132,252,0.45)',
    bg: 'rgba(192,132,252,0.07)',
    svg: <TttSvg />,
  },
  {
    key: 'checkers',
    titleKey: 'nav.checkers',
    descKey: 'home.checkersDesc',
    route: '/checkers',
    color: '#fb923c',
    border: 'rgba(251,146,60,0.45)',
    bg: 'rgba(251,146,60,0.07)',
    svg: <CheckersSvg />,
  },
  {
    key: 'uno',
    titleKey: 'nav.uno',
    descKey: 'home.unoDesc',
    route: '/uno',
    color: '#ef4444',
    border: 'rgba(239,68,68,0.45)',
    bg: 'rgba(239,68,68,0.07)',
    svg: <UnoSvg />,
  },
  {
    key: 'memory',
    titleKey: 'nav.memory',
    descKey: 'home.memoryDesc',
    route: '/memory',
    color: '#a78bfa',
    border: 'rgba(167,139,250,0.45)',
    bg: 'rgba(167,139,250,0.07)',
    svg: <MemoryMatchSvg />,
  },
  {
    key: 'hangman',
    titleKey: 'nav.hangman',
    descKey: 'home.hangmanDesc',
    route: '/hangman',
    color: '#facc15',
    border: 'rgba(250,204,21,0.45)',
    bg: 'rgba(250,204,21,0.07)',
    svg: <HangmanSvg />,
  },
  {
    key: 'crossword',
    titleKey: 'nav.crossword',
    descKey: 'home.crosswordDesc',
    route: '/crossword',
    color: '#60d4a0',
    border: 'rgba(96,212,160,0.45)',
    bg: 'rgba(96,212,160,0.07)',
    svg: <CrosswordSvg />,
  },
]

export function HomePage({ user, userLabel, onSignIn, onSignOut }: HomePageProps) {
  const { t, i18n } = useTranslation()

  const switchLang = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('edu-mars:lang', lang)
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <span className="home-brand">EDU MARS</span>

        <div className="home-header-right">
          <div className="home-lang-switcher">
            <button
              type="button"
              className={`lang-btn${i18n.language === 'uz' ? ' is-active' : ''}`}
              onClick={() => switchLang('uz')}
            >
              UZ
            </button>
            <button
              type="button"
              className={`lang-btn${i18n.language === 'ru' ? ' is-active' : ''}`}
              onClick={() => switchLang('ru')}
            >
              RU
            </button>
          </div>

          {user ? (
            <div className="home-user-row">
              <span className="home-user-name" title={userLabel}>{userLabel}</span>
              <button type="button" className="home-signout-btn" onClick={onSignOut}>
                {t('nav.signOut')}
              </button>
            </div>
          ) : (
            <button type="button" className="home-signin-btn" onClick={onSignIn}>
              <IconGoogle />
              {t('nav.signIn')}
            </button>
          )}
        </div>
      </header>

      <main className="home-main">
        <div className="games-grid">
          {GAMES.map((game) => (
            <Link
              key={game.key}
              to={game.route}
              className="game-card"
              style={{
                '--card-color': game.color,
                '--card-border': game.border,
                '--card-bg': game.bg,
              } as React.CSSProperties}
            >
              <div className="game-card-image">
                {game.svg}
              </div>
              <div className="game-card-body">
                <h2 className="game-card-title" style={{ color: game.color }}>
                  {t(game.titleKey)}
                </h2>
                <p className="game-card-desc">{t(game.descKey)}</p>
                <span className="game-card-play">▶ O'YNASH</span>
              </div>
            </Link>
          ))}

          {user && (
            <Link
              to="/my-quizzes"
              className="game-card game-card--quizzes"
              style={{
                '--card-color': '#7fffd4',
                '--card-border': 'rgba(127,255,212,0.45)',
                '--card-bg': 'rgba(127,255,212,0.07)',
              } as React.CSSProperties}
            >
              <div className="game-card-image">
                <MyQuizzesSvg />
              </div>
              <div className="game-card-body">
                <h2 className="game-card-title" style={{ color: '#7fffd4' }}>
                  {t('nav.myTests')}
                </h2>
                <p className="game-card-desc">{t('home.myQuizzesDesc')}</p>
                <span className="game-card-play" style={{ color: '#7fffd4' }}>▶ OCHISH</span>
              </div>
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
