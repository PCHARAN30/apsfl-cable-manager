import { useState } from 'react'
import toast from 'react-hot-toast'
import { updateCurrentUser } from '../services/api'

export default function ProfileModal({ user, onClose, onSuccess }) {
  const [phone, setPhone] = useState(user?.phone || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (phone && !/^\d{10}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }
    if (password && password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    try {
      const payload = {}
      if (phone !== user?.phone) payload.phone = phone
      if (password) payload.password = password
      
      if (Object.keys(payload).length === 0) return onClose() // No changes made

      await updateCurrentUser(payload)
      toast.success('Profile updated successfully')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" onClick={onClose}/>
      <div className="relative w-full max-w-[400px] p-6 sm:p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl shadow-black/60 scale-in">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:18, color:'white' }}>Edit Profile</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-1.5">Username</label>
            <input type="text" className="w-full bg-slate-900/30 border border-white/5 text-slate-500 rounded-xl px-4 py-3 outline-none cursor-not-allowed" value={user?.username} disabled />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-1.5">Phone Number</label>
            <input type="text" className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner placeholder-slate-500" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="10-digit number" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-1.5">New Password</label>
            <input type="password" className="w-full bg-slate-900/50 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner placeholder-slate-500" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Leave blank to keep current" minLength={8} />
          </div>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex:1 }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ flex:1 }}>{loading ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  )
}