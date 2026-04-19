import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { getCustomers } from '../services/api'
import { useLang } from '../context/LanguageContext'
import PaymentModal from '../components/PaymentModal'
import ViewCustomerModal from '../components/ViewCustomerModal'

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
  const [payModal, setPayModal] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [recentSearches, setRecentSearches] = useState(() => JSON.parse(localStorage.getItem('recent_searches') || '[]'))
  const [showRecents, setShowRecents] = useState(false)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)

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
      // Silent catch: User will see "No customers found" fallback
    } finally {
      setLoading(false)
    }
  }

  const toggleListening = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error('Voice search is not supported in this browser.');
        return;
      }
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript.replace(/\.$/, '')); // Remove trailing period
      };
      recognition.onerror = (event) => { 
        if(event.error !== 'no-speech') toast.error(`Microphone error: ${event.error}`); 
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (err) {
      setIsListening(false);
      toast.error('Could not start microphone. Check permissions.');
    }
  };

  const saveRecentSearch = (term) => {
    if (!term || term.trim().length < 2) return;
    const cleanTerm = term.trim();
    setRecentSearches(prev => {
      const updated = [cleanTerm, ...prev.filter(t => t.toLowerCase() !== cleanTerm.toLowerCase())].slice(0, 5);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchResults(query), 300)
    return () => clearTimeout(delay)
  }, [query])

  return (
    <div className="page max-w-4xl mx-auto !mt-0 !pt-0">
      {/* Top Section (Sticky Container) */}
      <div className="sticky top-0 z-40 bg-[var(--bg-base)] pb-4 -mt-4 pt-2 -mx-4 px-4 md:-mt-8 md:pt-8 md:-mx-8 md:px-8 border-b border-[var(--border-color)] mb-4 shadow-sm md:shadow-none">
        <div className="fade-up text-center mb-4 mt-2">
          <h1 className="font-display font-extrabold text-3xl text-[var(--text-base)] mb-2 tracking-tight">Quick Search</h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-xs md:text-sm">Enter a CAF number, phone number, or name to view customer details.</p>
        </div>

        <div className="fade-up stagger-1 relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <svg className={`w-6 h-6 transition-colors ${query ? 'text-emerald-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input 
            ref={inputRef}
            autoFocus
            type="text" 
            className="w-full bg-[var(--surface2)] border-2 border-[var(--border-color)] text-[var(--text-base)] text-base md:text-lg rounded-xl md:rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500/50 outline-none transition-all py-3 pr-14 pl-12 md:py-4 md:pl-14 shadow-md md:shadow-2xl placeholder-slate-500" 
            placeholder="Search CAF e.g., 100123..."
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            onFocus={() => setShowRecents(true)}
            onBlur={() => setTimeout(() => setShowRecents(false), 200)}
          />
          <div className="absolute inset-y-0 right-2 md:right-3 flex items-center">
            {query ? (
               <button type="button" onClick={() => setQuery('')} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-[var(--border-color)]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            ) : (
              <button type="button" onClick={toggleListening} className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/40' : 'text-emerald-500 hover:bg-emerald-500/10'}`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
            )}
          </div>

          {/* Recent Searches Dropdown */}
          {showRecents && !query && recentSearches.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 overflow-hidden fade-in">
              <div className="px-4 py-3 bg-[var(--surface2)] border-b border-[var(--border-color)] flex justify-between items-center">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Recent Searches</span>
                <button onMouseDown={(e) => { e.preventDefault(); setRecentSearches([]); localStorage.removeItem('recent_searches'); }} className="text-[10px] font-bold text-red-400 hover:text-red-500 uppercase tracking-widest">Clear</button>
              </div>
              <ul>
                {recentSearches.map((term, i) => (
                  <li key={i}>
                    <button onMouseDown={(e) => { e.preventDefault(); setQuery(term); setShowRecents(false); }} className="w-full text-left px-5 py-3.5 flex items-center gap-3 hover:bg-[var(--surface2)] transition-colors border-b border-[var(--border-color)] last:border-0 group">
                      <svg className="w-4 h-4 text-[var(--text-muted)] group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="font-semibold text-[var(--text-base)]">{term}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="fade-up stagger-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl w-full" />)
        ) : query && results.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 bg-[var(--surface2)] border border-[var(--border-color)] rounded-2xl">No customers found matching "{query}"</div>
        ) : results.map(c => (
          <div key={c._id} onClick={() => { setViewModal(c); saveRecentSearch(query); }} className="flex flex-col bg-[var(--glass-bg)] border border-[var(--border-color)] p-5 rounded-2xl hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all cursor-pointer shadow-sm group">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-[var(--text-base)] text-lg group-hover:text-emerald-400 transition-colors">{c.name}</h3>
              <StatusBadge status={c.status} />
            </div>
            <div className="flex-1">
              <p className="font-mono text-sm text-[var(--text-muted)] font-medium mb-1">CAF: <span className="font-bold text-[var(--text-base)] text-base">{c.cafNumber}</span></p>
              <p className="text-sm text-[var(--text-muted)] font-medium">Package: <span className="font-mono font-bold text-[var(--text-base)]">{c.planName || 'HomeBasic'}</span> {c.phone && <span className="font-bold text-[var(--text-base)] ml-1">• Ph: {c.phone}</span>}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5 mb-4">Conn. Date: <span className="font-bold text-[var(--text-base)]">{c.connectionDate ? new Date(c.connectionDate).toLocaleDateString('en-IN') : 'NA/Unknown'}</span></p>
            </div>
            <div className="pt-4 border-t border-[var(--border-color)] flex gap-3 mt-auto">
              <button onClick={(e) => { e.stopPropagation(); setPayModal(c); saveRecentSearch(query); }} className="flex-1 py-3 text-sm font-bold rounded-xl text-white bg-[#22C55E] hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                Quick Pay
              </button>
              <button onClick={(e) => { e.stopPropagation(); setViewModal(c); saveRecentSearch(query); }} className="py-3 px-5 text-sm font-bold rounded-xl text-slate-600 dark:text-slate-300 bg-[var(--surface2)] hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {viewModal && <ViewCustomerModal customer={viewModal} onClose={() => setViewModal(null)} />}
      {payModal && <PaymentModal customer={payModal} onClose={() => setPayModal(null)} onSuccess={() => fetchResults(query)} />}
    </div>
  )
}