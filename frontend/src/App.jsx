import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Payments from './pages/Payments'
import Import from './pages/Import'
import Layout from './components/Layout'
import SearchCAF from './pages/SearchCAF'
import PinLockScreen from './pages/PinLockScreen'
import Settings from './pages/Settings'

const Placeholder = ({ title }) => (
  <div className="page flex items-center justify-center min-h-[50vh]">
    <div className="text-center fade-up">
      <div className="w-16 h-16 bg-[var(--surface2)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border-color)]">
        <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
      </div>
      <h1 className="text-2xl font-bold text-[var(--text-base)] mb-2">{title}</h1>
      <p className="text-[var(--text-muted)]">This module is currently under construction.</p>
    </div>
  </div>
)

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [hasPin, setHasPin] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)

  useEffect(() => {
    const storedPin = localStorage.getItem('app_pin_hash')
    if (storedPin) {
      setHasPin(true)
      setShowWelcome(false) // Skip welcome, go straight to lock screen
    }

    const AUTO_LOCK_MS = 24 * 60 * 60 * 1000; // 24 hours

    const checkAutoLock = () => {
      const lastActive = localStorage.getItem('app_last_active');
      if (lastActive && Date.now() - parseInt(lastActive, 10) > AUTO_LOCK_MS) {
        setIsUnlocked(false);
        setShowWelcome(true);
      }
    };

    checkAutoLock();
    if (!localStorage.getItem('app_last_active')) {
      localStorage.setItem('app_last_active', Date.now().toString());
    }

    let throttleTimer;
    const updateActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        localStorage.setItem('app_last_active', Date.now().toString());
        throttleTimer = null;
      }, 5000);
    };

    const events = ['mousemove', 'keydown', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, updateActivity));

    const intervalId = setInterval(checkAutoLock, 60000);

    const handleVisibilityChange = () => {
      if (!document.hidden) checkAutoLock();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
      clearTimeout(throttleTimer);
    };
  }, [])

  // 1. If PIN is set but app is locked
  if (hasPin && !isUnlocked) {
    return <PinLockScreen onUnlock={() => setIsUnlocked(true)} />
  }

  // 2. If NO PIN is set, and user hasn't clicked "Tap to Enter"
  if (!hasPin && showWelcome) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-base)] p-4">
        <div className="text-center max-w-sm w-full fade-up bg-[var(--bg-surface)] p-8 rounded-3xl border border-[var(--border-color)] shadow-2xl">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-white" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          </div>
          <h1 className="text-3xl font-extrabold mb-2 text-[var(--text-base)]">CableSync</h1>
          <p className="text-[var(--text-muted)] text-sm mb-8 font-medium">Operator Workspace</p>
          
          <div className="mb-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-sm">
            Welcome! Tap below to enter. You can set up a secure password inside your settings.
          </div>

          <button onClick={() => { setShowWelcome(false); setIsUnlocked(true); }} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">
            Enter Workspace
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </div>
      </div>
    )
  }

  // 3. Main Application
  return (
    <div className="app-container">
      <Layout onLock={() => {
        if (hasPin) setIsUnlocked(false)
        else setShowWelcome(true)
      }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/search" element={<SearchCAF />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/import" element={<Import />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </div>
  )
}
