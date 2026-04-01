import { NavLink } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'

const NAV = [
  { to: '/',          key: 'dashboard',  icon: IconDash },
  { to: '/customers', key: 'customers',  icon: IconUsers },
  { to: '/payments',  key: 'payments',   icon: IconCard },
  { to: '/import',    key: 'importCSV',  icon: IconUpload },
]

export default function Sidebar({ open, onClose }) {
  const { t, lang, toggleLang } = useLang()

  return (
    <aside className={`
      fixed md:relative inset-y-0 left-0 z-50
      w-64 flex flex-col flex-shrink-0
      transition-transform duration-300 ease-in-out
      md:translate-x-0
      ${open ? 'translate-x-0' : '-translate-x-full'}
    `} style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>

      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'var(--brand)', boxShadow: '0 0 20px rgba(21,176,112,0.4)' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 15, color: 'white', lineHeight: 1.2 }}>APSFL</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.2 }}>Cable Manager</p>
          </div>
        </div>
        {/* Mobile close */}
        <button onClick={onClose} className="md:hidden btn-ghost">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, key, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ` +
              (isActive
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5')
            }
            style={({ isActive }) => isActive ? {
              background: 'rgba(21,176,112,0.15)',
              color: '#34d399',
              boxShadow: 'inset 0 0 0 1px rgba(21,176,112,0.25)',
            } : {}}
          >
            <Icon />
            {t(key)}
          </NavLink>
        ))}
      </nav>

      {/* Language toggle + footer */}
      <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <button onClick={toggleLang} className="lang-btn w-full justify-center">
          <span style={{ fontSize: 14 }}>{lang === 'en' ? '🇮🇳' : '🇬🇧'}</span>
          {lang === 'en' ? 'తెలుగు లో చూడండి' : 'Switch to English'}
        </button>
        <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>v1.0.0</p>
      </div>
    </aside>
  )
}

function IconDash()   { return <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> }
function IconUsers()  { return <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> }
function IconCard()   { return <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> }
function IconUpload() { return <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> }
