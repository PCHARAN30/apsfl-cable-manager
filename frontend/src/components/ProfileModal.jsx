import { useState } from 'react'
import toast from 'react-hot-toast'

// A simple, non-crypto hash for obfuscation. Must match PinLockScreen.
const hashPin = (pin) => btoa(pin + 'cablesync-salt');

export default function ProfileModal({ onClose, onSuccess }) {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const hasPin = !!localStorage.getItem('app_pin_hash')

  const handleSubmit = async () => {
    if (pin && !/^\d{4}$/.test(pin)) {
      toast.error('PIN must be exactly 4 digits')
      return
    }

      if (pin) {
        localStorage.setItem('app_pin_hash', hashPin(pin));
        toast.success('PIN lock enabled!');
      }

      onSuccess()
      onClose()
  }

  const handleRemovePin = () => {
    if (window.confirm('Are you sure you want to remove the PIN lock?')) {
      localStorage.removeItem('app_pin_hash')
      toast.success('PIN lock removed')
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" onClick={onClose}/>
      <div className="relative w-full max-w-[400px] p-6 sm:p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl shadow-black/60 scale-in">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:18, color:'white' }}>App Security</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-1.5">4-Digit PIN Lock</label>
            <input type="password" inputMode="numeric" maxLength="4" className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner placeholder-slate-500" value={pin} onChange={e=>setPin(e.target.value)} placeholder="Set a 4-digit PIN for quick access" />
          </div>
          
          {hasPin && (
            <button onClick={handleRemovePin} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-semibold border border-red-500/20 transition-all">
              Remove Active PIN
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