import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { getSettings } from '../services/api'
import toast from 'react-hot-toast'
import ProfileModal from './ProfileModal'

const IcoDash = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
const IcoUsers = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
const IcoSearch = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
const IcoPay = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
const IcoImport = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
const IcoSettings = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>

export default function Layout({ onLock, children }) {
  const { t } = useLang()
  const { pathname } = useLocation()
  const [profileModal, setProfileModal] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const [companyName, setCompanyName] = useState('CableSync')

  useEffect(() => {
    getSettings().then(res => {
      if (res.data?.data?.companyName) setCompanyName(res.data.data.companyName);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const navItems = [
    { path: '/', label: t('dashboard'), icon: IcoDash },
    { path: '/customers', label: t('customers'), icon: IcoUsers },
    { path: '/search', label: t('searchCAF'), icon: IcoSearch },
    { path: '/payments', label: t('payments'), icon: IcoPay },
    { path: '/import', label: t('importCSV'), icon: IcoImport },
    { path: '/settings', label: t('settings') || 'Settings', icon: IcoSettings },
  ]

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 relative overflow-hidden font-sans transition-colors duration-300">

      {/* Global Top-Right Controls */}
      <div className="absolute top-3 right-4 md:top-6 md:right-8 z-40 flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 shadow-md">
        <button onClick={() => setProfileModal(true)} className="md:hidden text-slate-700 dark:text-slate-300 hover:text-emerald-500 transition-colors flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </button>
        <div className="md:hidden w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
        <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} className="text-slate-700 dark:text-slate-300 hover:text-orange-500 transition-colors flex items-center justify-center">
          {theme==='dark' ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
        </button>
        <div className="md:hidden w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
        <button onClick={onLock} className="md:hidden text-slate-700 dark:text-slate-300 hover:text-red-500 transition-colors flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-blue-600 z-30 flex items-center justify-between px-5 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          </div>
          <h2 className="font-display font-bold text-lg text-white">{companyName}</h2>
        </div>
      </header>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col inset-y-0 left-0 z-50 w-72 bg-slate-800 text-slate-200 transition-transform duration-300 ease-out relative shadow-none">
        <div className="p-6 hidden md:flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-white tracking-tight leading-none">{companyName}</h2>
            <p className="text-xs text-yellow-400 font-medium tracking-wide mt-1">Manager</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1 px-4 mt-6 md:mt-0 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-4 rounded-xl text-base font-bold transition-all duration-200 flex items-center gap-4 ${pathname === item.path ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
            >
              <item.icon />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/20 flex flex-col gap-2">
          <button onClick={() => setProfileModal(true)} className="w-full py-2.5 bg-[var(--surface2)] hover:bg-white/10 text-white rounded-xl font-bold text-sm transition-all duration-200 flex justify-center items-center gap-2 border border-white/10">
            <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Security & PIN
          </button>
          <button onClick={onLock} className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold text-sm transition-all duration-200 flex justify-center items-center gap-2 border border-red-500/10">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Lock App
          </button>
        </div>
      </aside>

      {/* Main Page Content */}
      <main className="flex-1 h-full overflow-y-auto pt-24 pb-24 px-4 md:pt-8 md:pb-10 md:px-8 relative z-10 scroll-smooth bg-[var(--bg-base)]">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Tab Bar (WhatsApp / Material 3 Style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 flex justify-around items-center px-1 pb-2 pt-2 shadow-[0_-8px_15px_rgba(0,0,0,0.03)]">
        {navItems.map(item => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 gap-1 transition-all ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300'}`}
            >
              <div className={`py-1 px-3 sm:px-4 rounded-full transition-colors ${isActive ? 'bg-blue-100 dark:bg-blue-500/20' : 'bg-transparent'}`}>
                <item.icon />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-center leading-tight whitespace-nowrap">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {profileModal && <ProfileModal onClose={() => setProfileModal(false)} onSuccess={() => window.location.reload()} />}
    </div>
  )
}