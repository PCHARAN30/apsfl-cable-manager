import { useState } from 'react'
import { login } from '../services/api'
import toast from 'react-hot-toast'
import { useLang } from '../context/LanguageContext'

export default function Login({ onLogin }) {
  const { t } = useLang()
  // Default credentials provided here
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await login({ username, password })
      toast.success(t('loginSuccess') || 'Logged in successfully')
      if (onLogin) onLogin(res.data)
    } catch (err) {
      console.error("Login Error Details:", err);
      toast.error(err.response?.data?.message || t('loginFailed') || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-[420px] p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/50 fade-up">
        <h1 className="font-display font-extrabold text-3xl text-white text-center mb-8 tracking-tight">
          {t('login') || 'Login'}
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 block">
              {t('username') || 'Username'}
            </label>
            <input
              type="text"
              className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner placeholder-slate-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 block">
              {t('password') || 'Password'}
            </label>
            <input
              type="password"
              className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner placeholder-slate-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="w-full mt-2 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all duration-200">
            {loading ? (t('loggingIn') || 'Logging in...') : (t('loginBtn') || 'Login')}
          </button>
        </form>
      </div>
    </div>
  )
}