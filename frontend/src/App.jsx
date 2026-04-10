import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { getCurrentUser } from './services/api'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Payments from './pages/Payments'
import Import from './pages/Import'
import Layout from './components/Layout'
import SearchCAF from './pages/SearchCAF'

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
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for an existing session on initial load
  useEffect(() => {
    const verifySession = async () => {
      const storedUserId = localStorage.getItem('apsfl_userId')
      if (!storedUserId) {
        setLoading(false)
        return // Skip unnecessary API call if completely logged out
      }
      
      try {
        const res = await getCurrentUser()
        // Our backend returns { success: true, data: { username, role } }
        setUser(res.data.data) 
      } catch (err) {
        console.debug('Session check failed:', err.message)
        // If it fails (e.g., 401 Not Authenticated), we keep user as null
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    verifySession()
  }, [])

  // 1. Show a loading state while checking the cookie
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)' }}>
        Loading session...
      </div>
    )
  }

  // 2. If no user is found, restrict them to the Login page
  if (!user) {
    return <Login onLogin={(userData) => setUser(userData)} />
  }

  // 3. If a user exists, render the main authenticated application
  return (
    <div className="app-container">
      <Layout user={user} onLogout={() => setUser(null)}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/search" element={<SearchCAF />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/import" element={<Import />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </div>
  )
}
