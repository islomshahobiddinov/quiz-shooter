import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { User } from '@supabase/supabase-js'

type SidebarProps = {
  user: User | null
  userLabel: string
  onSignIn: () => void
  onSignOut: () => void
}

function IconQuiz() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="1" y="2" width="13" height="2" rx="1" fill="currentColor" />
      <rect x="1" y="6.5" width="13" height="2" rx="1" fill="currentColor" />
      <rect x="1" y="11" width="8" height="2" rx="1" fill="currentColor" />
    </svg>
  )
}

function IconMyQuizzes() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="2" y="1" width="9" height="11" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 5h5M5 8h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function IconMafia() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.4" />
      <line x1="7.5" y1="1.5" x2="7.5" y2="4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="7.5" y1="10.5" x2="7.5" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="1.5" y1="7.5" x2="4.5" y2="7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="10.5" y1="7.5" x2="13.5" y2="7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
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

export function Sidebar({ user, userLabel, onSignIn, onSignOut }: SidebarProps) {
  const { t, i18n } = useTranslation()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar-link${isActive ? ' is-active' : ''}`

  const switchLang = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('edu-mars:lang', lang)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-brand">EDU MARS</span>
        {user && <span className="sidebar-user" title={userLabel}>{userLabel}</span>}
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={linkClass}>
          <IconQuiz />
          {t('nav.tests')}
        </NavLink>
        {user && (
          <NavLink to="/my-quizzes" className={linkClass}>
            <IconMyQuizzes />
            {t('nav.myTests')}
          </NavLink>
        )}
        <NavLink to="/mafia" className={linkClass}>
          <IconMafia />
          {t('nav.mafiaGame')}
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="lang-switcher">
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
          <button type="button" className="sidebar-signout" onClick={onSignOut}>
            {t('nav.signOut')}
          </button>
        ) : (
          <button type="button" className="sidebar-signin" onClick={onSignIn}>
            <IconGoogle />
            {t('nav.signIn')}
          </button>
        )}
      </div>
    </aside>
  )
}
