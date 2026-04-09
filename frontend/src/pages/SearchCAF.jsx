import { useState, useEffect, useRef } from 'react'
import { getCustomers } from '../services/api'
import { useLang } from '../context/LanguageContext'
import PaymentModal from '../components/PaymentModal'

const StatusBadge = ({ status }) => {
  const cls = { 
    PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', 
    UNPAID: 'bg-red-500/10 text-red-400 border-red-500/20', 
    PARTIAL: 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
  }
  const dot = { PAID: '#34d399', UNPAID: '#f87171', PARTIAL: '#fbbf24' }
  
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 w-max border ${cls[status]||cls.UNPAID}`}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:dot[status] }}/>
      {status}
    </span>
  )
}

export default function SearchCAF() {
  const { t } = useLang()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [payModal, setPayModal] = useState(null)
  const inputRef = useRef(null)

  const fetchResults = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await getCustomers({ search: searchQuery, limit: 12 })
      setResults(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delay = setTimeout(() => fetchResults(query), 300)
    return () => clearTimeout(delay)
  }, [query])

  return (
    <div className="page max-w-4xl mx-auto">
      <div className="fade-up text-center mb-8 mt-4">
        <h1 className="font-display font-extrabold text-3xl text-[var(--text-base)] mb-3 tracking-tight">Quick Search</h1>
        <p className="text-[var(--text-muted)] text-sm">Enter a CAF number, phone number, or name to quickly log a payment.</p>
      </div>

      <div className="fade-up stagger-1 relative mb-8">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <svg className={`w-6 h-6 transition-colors ${query ? 'text-emerald-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <input 
          ref={inputRef}
          autoFocus
          type="text" 
          className="w-full bg-[var(--surface2)] border-2 border-[var(--border-color)] text-[var(--text-base)] text-lg rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500/50 outline-none transition-all py-4 pr-6 pl-14 shadow-2xl placeholder-slate-500" 
          placeholder="Search CAF e.g., 100123..."
          value={query} 
          onChange={e => setQuery(e.target.value)} 
        />
      </div>

      <div className="fade-up stagger-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl w-full" />)
        ) : query && results.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 bg-[var(--surface2)] border border-[var(--border-color)] rounded-2xl">No customers found matching "{query}"</div>
        ) : results.map(c => (
          <div key={c._id} onClick={() => setPayModal(c)} className="bg-[var(--glass-bg)] border border-[var(--border-color)] p-5 rounded-2xl hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all cursor-pointer shadow-sm group">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-[var(--text-base)] text-lg group-hover:text-emerald-400 transition-colors">{c.name}</h3>
              <StatusBadge status={c.status} />
            </div>
            <p className="font-mono text-sm text-slate-400 mb-1">CAF: <span className="text-[var(--text-base)]">{c.cafNumber}</span></p>
            <p className="text-sm text-slate-400">Plan: <span className="font-mono text-[var(--text-base)]">₹{c.planAmount || 300}</span> {c.phone && `• Ph: ${c.phone}`}</p>
          </div>
        ))}
      </div>

      {payModal && <PaymentModal customer={payModal} onClose={() => setPayModal(null)} onSuccess={() => fetchResults(query)} />}
    </div>
  )
}