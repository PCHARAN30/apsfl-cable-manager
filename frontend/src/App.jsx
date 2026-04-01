import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { getCurrentUser } from './services/api'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Payments from './pages/Payments'
import Import from './pages/Import'
import Layout from './components/Layout'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for an existing session on initial load
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await getCurrentUser()
        // Our backend returns { success: true, data: { username, role } }
        setUser(res.data.data) 
      } catch (err) {
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
          <Route path="/payments" element={<Payments />} />
          <Route path="/import" element={<Import />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </div>
  )
}
