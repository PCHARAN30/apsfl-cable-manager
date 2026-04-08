import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, signup } from '../services/api'
import toast from 'react-hot-toast'
import { useLang } from '../context/LanguageContext'

export default function Login({ onLogin }) {
  const { t } = useLang()
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [operatorCode, setOperatorCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isLogin && password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }
    if (!isLogin && !/^\d{10}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }

    setLoading(true)
    try {
      if (isLogin) {
        const res = await login({ username, password })
        localStorage.setItem('apsfl_userId', res.data.userId)
        toast.success(t('loginSuccess') || 'Logged in successfully')
        navigate('/customers')
        if (onLogin) onLogin(res.data.data)
      } else {
        const res = await signup({ username, email, phone, password, operatorCode })
        localStorage.setItem('apsfl_userId', res.data.userId)
        toast.success('Signed up successfully')
        navigate('/customers')
        if (onLogin) onLogin(res.data.data)
      }
    } catch (err) {
      console.error("Login Error Details:", err);
      toast.error(err.response?.data?.message || (isLogin ? t('loginFailed') : 'Signup failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-300 overflow-hidden font-sans">
      
      {/* LEFT SIDE - BRANDING (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-center items-center p-12 overflow-hidden bg-slate-900/50 border-r border-white/5">
        {/* Ambient Glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-md fade-up">
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30 border border-white/10">
            <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-white" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          </div>
          <h1 className="text-4xl font-display font-extrabold text-white mb-4 tracking-tight">
            APSFL <span className="text-emerald-400">Manager</span>
          </h1>
          <p className="text-base text-slate-400 font-medium leading-relaxed">
            Operator-grade software for modern cable businesses. Manage customers, track payments, and scale your operations.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-slate-950">
        <div className="w-full max-w-[400px] relative z-10 fade-up stagger-1">
          <div className="mb-10">
            <h2 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">
              {isLogin ? 'Welcome back 👋' : 'Create Account'}
            </h2>
            <p className="text-slate-400 text-sm">
              {isLogin ? 'Enter your details to access your dashboard.' : 'Register as a new operator.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          {!isLogin && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 block">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner placeholder-slate-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 block">
                  Phone Number
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner placeholder-slate-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit number"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 block">
                  Operator Code
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner placeholder-slate-500"
                  value={operatorCode}
                  onChange={(e) => setOperatorCode(e.target.value)}
                  placeholder="Secret access code"
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 block">
              {t('password') || 'Password'}
            </label>
            <input
              type="password"
              className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner placeholder-slate-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Enter password" : "Min 8 characters"}
              required
              minLength={isLogin ? 1 : 8}
            />
          </div>
            <button type="submit" disabled={loading} className="w-full mt-4 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all duration-200">
              {loading ? 'Processing...' : (isLogin ? (t('loginBtn') || 'Login') : 'Sign Up')}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}