type SidebarView = 'public' | 'mine' | 'mafia'

type SidebarProps = {
  view: SidebarView
  onChange: (view: SidebarView) => void
  userLabel: string
  onSignOut: () => void
}

export function Sidebar({ view, onChange, userLabel, onSignOut }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-brand">QUIZ SHOOTER</span>
        <span className="sidebar-user" title={userLabel}>{userLabel}</span>
      </div>

      <nav className="sidebar-nav">
        <button
          type="button"
          className={`sidebar-link${view === 'public' ? ' is-active' : ''}`}
          onClick={() => onChange('public')}
        >
          TESTLAR
        </button>
        <button
          type="button"
          className={`sidebar-link${view === 'mine' ? ' is-active' : ''}`}
          onClick={() => onChange('mine')}
        >
          MENING TESTLARIM
        </button>
        <button
          type="button"
          className={`sidebar-link sidebar-link--mafia${view === 'mafia' ? ' is-active' : ''}`}
          onClick={() => onChange('mafia')}
        >
          🔴 MAFIA O'YINI
        </button>
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-signout" onClick={onSignOut}>
          CHIQISH
        </button>
      </div>
    </aside>
  )
}

export type { SidebarView }
