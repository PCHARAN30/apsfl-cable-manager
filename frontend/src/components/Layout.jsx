import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { logout } from '../services/api'
import toast from 'react-hot-toast'
import ProfileModal from './ProfileModal'

const IcoDash = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
const IcoUsers = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
const IcoSearch = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
const IcoPay = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
const IcoImport = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>

export default function Layout({ user, onLogout, children }) {
  const { t, lang, setLang } = useLang()
  const { pathname } = useLocation()
  const [loggingOut, setLoggingOut] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileModal, setProfileModal] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } catch (err) {
      console.warn('Backend logout failed, clearing local session anyway.', err)
    }
    
    // ALWAYS clear frontend state regardless of backend success
    localStorage.removeItem('apsfl_userId')
    toast.success(t('logoutSuccess') || 'Logged out successfully')
    if (onLogout) onLogout()
    setLoggingOut(false)
  }

  const navItems = [
    { path: '/', label: t('dashboard'), icon: IcoDash },
    { path: '/customers', label: t('customers'), icon: IcoUsers },
    { path: '/search', label: t('searchCAF'), icon: IcoSearch },
    { path: '/payments', label: t('payments'), icon: IcoPay },
    { path: '/import', label: t('importCSV'), icon: IcoImport },
  ]

  return (
    <div className="flex h-screen bg-[#F5F7FA] dark:bg-[#061428] text-[#1E293B] dark:text-slate-200 relative overflow-hidden font-sans transition-colors duration-300">

      {/* Global Top-Right Controls */}
      <div className="absolute top-3 right-4 md:top-6 md:right-8 z-40 flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
        <select value={lang} onChange={e=>setLang(e.target.value)} className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer appearance-none">
          <option value="en">EN</option>
          <option value="te">TE</option>
        </select>
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-700"></div>
        <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} className="text-slate-700 dark:text-slate-300 hover:text-orange-500 transition-colors flex items-center justify-center">
          {theme==='dark' ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
        </button>
      </div>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-[#FACC15] to-[#F97316] z-30 flex items-center justify-between px-5 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          </div>
          <h2 className="font-display font-bold text-lg text-white">APSFL</h2>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="text-white/90 hover:text-white transition-colors mr-14">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      <div className={`md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)} aria-hidden="true" />

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0B1F3A] text-slate-300 flex flex-col transition-transform duration-300 ease-out md:relative md:translate-x-0 shadow-2xl md:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 hidden md:flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-white tracking-tight leading-none">APSFL</h2>
            <p className="text-xs text-yellow-400 font-medium tracking-wide mt-1">Manager</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1 px-4 mt-6 md:mt-0 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-3 ${pathname === item.path ? 'bg-black/20 text-white' : 'text-slate-400 hover:text-white hover:bg-black/20'}`}
            >
              <item.icon />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 flex flex-col gap-3 bg-black/20">
          <div className="flex items-center justify-between px-2 mb-1">
            <button onClick={() => setProfileModal(true)} className="text-sm font-medium text-white hover:opacity-80 transition-colors flex items-center gap-1.5 outline-none">
              {user?.username}
              <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>

          <button onClick={handleLogout} disabled={loggingOut} className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm flex justify-center items-center gap-2">
            {loggingOut ? '...' : t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Page Content */}
      <main className="flex-1 h-full overflow-y-auto pt-24 pb-10 px-4 md:pt-8 md:px-8 relative z-10 scroll-smooth bg-[var(--bg-base)]">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {profileModal && <ProfileModal user={user} onClose={() => setProfileModal(false)} onSuccess={() => window.location.reload()} />}
    </div>
  )
}