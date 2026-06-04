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
