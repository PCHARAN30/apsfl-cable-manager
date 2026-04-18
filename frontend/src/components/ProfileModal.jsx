import { useState } from 'react'
import toast from 'react-hot-toast'

// A simple, non-crypto hash for obfuscation. Must match PinLockScreen.
const hashPin = (pin) => btoa(pin + 'cablesync-salt');

export default function ProfileModal({ onClose, onSuccess }) {
  const [appPassword, setAppPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const hasPin = !!localStorage.getItem('app_pin_hash')

  const handleSubmit = async () => {
    if (appPassword && appPassword.length < 4) {
      toast.error('Password must be at least 4 characters long')
      return
    }

      if (appPassword) {
        localStorage.setItem('app_pin_hash', hashPin(appPassword.toLowerCase().trim()));
        toast.success('App password enabled!');
      }

      onSuccess()
      onClose()
  }

  const handleRemovePin = () => {
    if (window.confirm('Are you sure you want to remove the app password lock?')) {
      localStorage.removeItem('app_pin_hash')
      toast.success('App password removed')
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" onClick={onClose}/>
      <div className="relative w-full max-w-[400px] p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl scale-in">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:18, color:'var(--text-base)' }}>App Security</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] block mb-1.5">App Password Lock</label>
            <div className="relative w-full">
              <input type={showPassword ? "text" : "password"} className="input w-full pr-10" value={appPassword} onChange={e=>setAppPassword(e.target.value)} placeholder="Set an alphanumeric password" />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.688-1.571c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
              </button>
            </div>
          </div>
          
          {hasPin && (
            <button onClick={handleRemovePin} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-semibold border border-red-500/20 transition-all">
              Remove Active Password
            </button>
          )}
        </div>
        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ flex:1 }}>Save</button>
        </div>
      </div>
    </div>
  )
}