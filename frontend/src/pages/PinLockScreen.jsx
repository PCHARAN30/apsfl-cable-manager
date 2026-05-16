import { useState } from 'react'

// Legacy hash for backwards compatibility
const oldHashPin = (pin) => btoa(pin + 'cablesync-salt');

// Secure cryptographic hash using Web Crypto API
const hashPin = async (pin) => {
  const msgUint8 = new TextEncoder().encode(pin + 'cablesync-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export default function PinLockScreen({ onUnlock }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryKey, setRecoveryKey] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault();
    const storedHash = localStorage.getItem('app_pin_hash');
    const inputPin = password.toLowerCase().trim();
    
    let isMatch = false;
    
    // Backwards compatibility check for older basic hashes
    if (storedHash && storedHash.length < 64) {
      if (oldHashPin(inputPin) === storedHash) {
        isMatch = true;
        // Auto-migrate to secure hash
        localStorage.setItem('app_pin_hash', await hashPin(inputPin));
      }
    } else {
      isMatch = (await hashPin(inputPin)) === storedHash;
    }

    if (isMatch) {
      onUnlock(rememberMe);
    } else {
      setError(true);
      const timer = setTimeout(() => setPassword(''), 500);
      return () => clearTimeout(timer);
    }
  }

  const handleRecoverySubmit = (e) => {
    e.preventDefault();
    // Default operator secret key. You can change this to anything you prefer.
    const MASTER_KEY = 'admin123';
    
    if (recoveryKey.trim().toLowerCase() === MASTER_KEY.toLowerCase()) {
      localStorage.removeItem('app_pin_hash');
      localStorage.removeItem('app_remember_me');
      sessionStorage.removeItem('session_unlocked');
      window.location.reload();
    } else {
      setError(true);
      const timer = setTimeout(() => setRecoveryKey(''), 500);
      return () => clearTimeout(timer);
    }
  }

  if (showRecovery) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4 text-[var(--text-base)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/icon-512.png')] bg-cover bg-center opacity-10 blur-sm scale-105 pointer-events-none"></div>
        <form onSubmit={handleRecoverySubmit} className={`relative z-10 w-full max-w-sm bg-[var(--bg-surface)] p-8 border border-[var(--border-color)] rounded-3xl shadow-2xl text-center transition-transform duration-300 ${error ? 'animate-shake border-red-500/50' : ''}`}>
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4v-3.586l8.172-8.172A6 6 0 1115 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold mb-2">Emergency Reset</h1>
          <p className="text-[var(--text-muted)] mb-8 text-sm font-medium">Enter the operator secret key to reset the app password.</p>
          <div className="relative w-full mb-6">
            <input type="text" value={recoveryKey} onChange={e => { setRecoveryKey(e.target.value); setError(false); }} autoFocus className="w-full text-center text-xl tracking-widest bg-[var(--surface2)] border-2 border-[var(--border-color)] rounded-xl py-4 px-6 outline-none focus:border-amber-500 focus:bg-[var(--bg-surface)] text-[var(--text-base)] transition-all shadow-inner" placeholder="Secret Key" />
          </div>
          <button type="submit" className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-amber-500/30 transition-all active:scale-95 mb-4">Reset Password</button>
          <button type="button" onClick={() => { setShowRecovery(false); setError(false); setRecoveryKey(''); }} className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors">Cancel & Go Back</button>
          {error && <p className="text-red-500 text-sm mt-4 font-bold bg-red-500/10 py-2 rounded-lg">Invalid secret key.</p>}
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4 text-[var(--text-base)] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/icon-512.png')] bg-cover bg-center opacity-10 blur-sm scale-105 pointer-events-none"></div>
      <form onSubmit={handleSubmit} className={`relative z-10 w-full max-w-sm bg-[var(--bg-surface)] p-8 border border-[var(--border-color)] rounded-3xl shadow-2xl text-center transition-transform duration-300 ${error ? 'animate-shake border-red-500/50' : ''}`}>
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold mb-2">Welcome to CableSync</h1>
        <p className="text-[var(--text-muted)] mb-8 text-sm font-medium">Login with your existing password to open the app.</p>
        
        <div className="relative w-full mb-4">
          <input type={showPassword ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(false); }} autoFocus
            className="w-full text-center text-2xl tracking-widest bg-[var(--surface2)] border-2 border-[var(--border-color)] rounded-xl py-4 px-12 outline-none focus:border-blue-500 focus:bg-[var(--bg-surface)] text-[var(--text-base)] transition-all shadow-inner"
            placeholder="Enter Password" />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)} 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.688-1.571c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" /></svg> : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
          </button>
        </div>

        <div className="flex items-center justify-center mb-6 text-sm text-[var(--text-muted)]">
          <input type="checkbox" id="remember" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="mr-2 w-4 h-4 rounded border-[var(--border-color)] text-blue-600 focus:ring-blue-500 bg-[var(--surface2)] cursor-pointer" />
          <label htmlFor="remember" className="cursor-pointer font-medium">Remember me on this device</label>
        </div>

        <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 mb-4">
          Login
        </button>

        <button type="button" onClick={() => { setShowRecovery(true); setError(false); setPassword(''); }} className="text-sm font-bold text-[var(--text-muted)] hover:text-blue-500 transition-colors">
          Forgot Password?
        </button>
        
        {error && <p className="text-red-500 text-sm mt-4 font-bold bg-red-500/10 py-2 rounded-lg">Incorrect password. Try again.</p>}

      </form>
    </div>
  )
}