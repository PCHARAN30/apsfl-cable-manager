import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { logout } from '../services/api'
import toast from 'react-hot-toast'
import ProfileModal from './ProfileModal'

const IcoDash = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
const IcoUsers = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
const IcoPay = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
const IcoImport = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>

export default function Layout({ user, onLogout, children }) {
  const { t } = useLang()
  const { pathname } = useLocation()
  const [loggingOut, setLoggingOut] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileModal, setProfileModal] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [isTelugu, setIsTelugu] = useState(false)

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const handleTranslateToggle = () => {
    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = isTelugu ? 'en' : 'te';
      combo.dispatchEvent(new Event('change', { bubbles: true }));
      setIsTelugu(!isTelugu);
      return;
    }

    // If not ready, poll for a few seconds before giving up.
    const toastId = toast.loading('Initializing translator...');
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        clearInterval(interval);
        toast.dismiss(toastId);
        combo.value = isTelugu ? 'en' : 'te';
        combo.dispatchEvent(new Event('change', { bubbles: true }));
        setIsTelugu(!isTelugu);
      } else if (attempts > 6) { // ~3 seconds
        clearInterval(interval);
        toast.error('Translation service failed to load.', { id: toastId });
      }
    }, 500);
  };

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } catch (err) {
      console.warn('Backend logout failed, clearing local session anyway.')
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
    { path: '/payments', label: t('payments'), icon: IcoPay },
    { path: '/import', label: t('importCSV'), icon: IcoImport },
  ]

  return (
    <div className="flex h-screen bg-[var(--bg-base)] text-[var(--text-base)] relative overflow-hidden font-sans transition-colors duration-300">
      {/* Ambient Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--border-color)] z-40 flex items-center justify-between px-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          </div>
          <h2 className="font-display font-bold text-lg text-[var(--text-base)]">APSFL</h2>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      <div className={`md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[var(--glass-bg)] backdrop-blur-xl border-r border-[var(--border-color)] flex flex-col transition-transform duration-300 ease-out md:relative md:translate-x-0 shadow-2xl md:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 hidden md:flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-[var(--text-base)] tracking-tight leading-none">APSFL</h2>
            <p className="text-xs text-emerald-400 font-medium tracking-wide mt-1">Manager</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1 px-4 mt-6 md:mt-0">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-3 ${pathname === item.path ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 shadow-[inset_0px_1px_1px_rgba(255,255,255,0.05)]' : 'text-[var(--text-muted)] hover:text-[var(--text-base)] hover:bg-[var(--border-color)]'}`}
            >
              <item.icon />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border-color)] flex flex-col gap-4 bg-[var(--surface2)]">
          <div className="flex items-center justify-between px-2">
            <button onClick={() => setProfileModal(true)} className="text-sm font-medium text-[var(--text-base)] hover:opacity-80 transition-colors flex items-center gap-1.5 outline-none">
              {user?.username}
              <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="bg-[var(--glass-bg)] hover:opacity-80 transition-opacity border border-[var(--border-color)] text-[var(--text-base)] px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button 
                onClick={handleTranslateToggle}
                className="bg-[var(--glass-bg)] hover:opacity-80 transition-opacity border border-[var(--border-color)] text-[var(--text-base)] px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
              >
                {isTelugu ? 'English' : 'Telugu'}
              </button>
              <div id="google_translate_element" className="hidden"></div>
            </div>
          </div>
          <button onClick={handleLogout} disabled={loggingOut} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm flex justify-center items-center gap-2">
            {loggingOut ? '...' : t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Page Content */}
      <main className="flex-1 h-full overflow-y-auto pt-24 pb-10 px-4 md:pt-8 md:px-8 relative z-10 scroll-smooth">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {profileModal && <ProfileModal user={user} onClose={() => setProfileModal(false)} onSuccess={() => window.location.reload()} />}
    </div>
  )
}