import { useState, useEffect } from 'react'

// A simple, non-crypto hash for obfuscation. Must match the one in ProfileModal.
const hashPin = (pin) => btoa(pin + 'cablesync-salt');

export default function PinLockScreen({ onUnlock }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault();
    const storedHash = localStorage.getItem('app_pin_hash');
    
    // Check password case-insensitively
    if (hashPin(password.toLowerCase().trim()) === storedHash) {
      onUnlock();
    } else {
      setError(true);
      const timer = setTimeout(() => setPassword(''), 500);
      return () => clearTimeout(timer);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4 text-[var(--text-base)]">
      <form onSubmit={handleSubmit} className={`w-full max-w-sm bg-[var(--bg-surface)] p-8 border border-[var(--border-color)] rounded-3xl shadow-2xl text-center transition-transform duration-300 ${error ? 'animate-shake border-red-500/50' : ''}`}>
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold mb-2">Welcome to CableSync</h1>
        <p className="text-[var(--text-muted)] mb-8 text-sm font-medium">Login with your existing password to open the app.</p>
        
        <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(false); }} autoFocus
          className="w-full text-center text-2xl tracking-widest bg-[var(--surface2)] border-2 border-[var(--border-color)] rounded-xl p-4 outline-none focus:border-blue-500 focus:bg-[var(--bg-surface)] text-[var(--text-base)] transition-all shadow-inner mb-6"
          placeholder="Enter Password" />

        <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95">
          Login
        </button>
        
        {error && <p className="text-red-500 text-sm mt-4 font-bold bg-red-500/10 py-2 rounded-lg">Incorrect password. Try again.</p>}

      </form>
    </div>
  )
}