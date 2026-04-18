import { useState, useEffect } from 'react'

// A simple, non-crypto hash for obfuscation. Must match the one in ProfileModal.
const hashPin = (pin) => btoa(pin + 'cablesync-salt');

export default function PinLockScreen({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const handlePinChange = (e) => {
    const newPin = e.target.value;
    if (/^\d{0,4}$/.test(newPin)) {
      setPin(newPin);
      setError(false);
    }
  }

  useEffect(() => {
    if (pin.length === 4) {
      const storedHash = localStorage.getItem('app_pin_hash');
      if (hashPin(pin) === storedHash) {
        onUnlock();
      } else {
        setError(true);
        // Add a shake animation for visual feedback
        const timer = setTimeout(() => setPin(''), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [pin, onUnlock]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
      <div className={`w-full max-w-xs text-center transition-transform duration-300 ${error ? 'animate-shake' : ''}`}>
        <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Enter PIN</h1>
        <p className="text-slate-400 mb-6">Enter your 4-digit PIN to unlock.</p>
        
        <input type="password" value={pin} onChange={handlePinChange} maxLength="4" autoFocus
          className="w-full text-center text-4xl tracking-[1em] bg-slate-800 border-2 border-slate-700 rounded-xl p-4 outline-none focus:border-blue-500 transition-all"
          style={{ caretColor: 'transparent' }} inputMode="numeric" />
        
        {error && <p className="text-red-500 text-sm mt-3 font-semibold">Incorrect PIN. Try again.</p>}

      </div>
    </div>
  )
}