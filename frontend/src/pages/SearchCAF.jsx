import { useState, useEffect, useRef } from 'react'
import { getCustomers } from '../services/api'
import { useLang } from '../context/LanguageContext'

function ViewCustomerModal({ customer, onClose }) {
  if (!customer) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}/>
      <div className="relative w-full max-w-[440px] p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl shadow-black/60 scale-in">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:18, color:'var(--text-base)' }}>Customer Details</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="space-y-4 text-sm">
          <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Name</span><div className="font-semibold text-[var(--text-base)]">{customer.name}</div></div>
          <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">CAF Number</span><div className="font-mono text-[var(--text-base)]">{customer.cafNumber}</div></div>
          <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Phone</span><div className="text-[var(--text-base)]">{customer.phone || 'NA'}</div></div>
          <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Address</span><div className="text-[var(--text-base)]">{customer.address || 'NA'}</div></div>
          <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Plan Amount</span><div className="font-mono text-[var(--text-base)]">₹{customer.planAmount || 300}</div></div>
          <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">PON Number</span><div className="font-mono text-[var(--text-base)]">{customer.ponNumber || 'NA'}</div></div>
          <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Connection Date</span><div className="text-[var(--text-base)]">{customer.connectionDate ? new Date(customer.connectionDate).toLocaleDateString() : 'NA'}</div></div>
          <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Notes</span><div className="text-[var(--text-base)]">{customer.notes || 'NA'}</div></div>
        </div>
        <div className="mt-8">
          <button onClick={onClose} className="btn-secondary w-full">Close</button>
        </div>
      </div>
    </div>
  );
}

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
  const [viewModal, setViewModal] = useState(null)
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
        <p className="text-[var(--text-muted)] text-sm">Enter a CAF number, phone number, or name to view customer details.</p>
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
          <div key={c._id} onClick={() => setViewModal(c)} className="bg-[var(--glass-bg)] border border-[var(--border-color)] p-5 rounded-2xl hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all cursor-pointer shadow-sm group">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-[var(--text-base)] text-lg group-hover:text-emerald-400 transition-colors">{c.name}</h3>
              <StatusBadge status={c.status} />
            </div>
            <p className="font-mono text-sm text-slate-400 mb-1">CAF: <span className="text-[var(--text-base)]">{c.cafNumber}</span></p>
            <p className="text-sm text-slate-400">Plan: <span className="font-mono text-[var(--text-base)]">₹{c.planAmount || 300}</span> {c.phone && `• Ph: ${c.phone}`}</p>
          </div>
        ))}
      </div>

      {viewModal && <ViewCustomerModal customer={viewModal} onClose={() => setViewModal(null)} />}
    </div>
  )
}