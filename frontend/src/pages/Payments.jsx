import { useEffect, useState } from 'react'
import { getAllPayments, deletePayment } from '../services/api'
import { useLang } from '../context/LanguageContext'
import toast from 'react-hot-toast'
import PaymentHistoryModal from '../components/PaymentHistoryModal'

const fmtDate = d => new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit',hour:'2-digit',minute:'2-digit'})

export default function Payments() {
  const { t } = useLang()
  const [payments, setPayments] = useState([])
  const [total, setTotal]       = useState(0)
  const [totalAmt, setTotalAmt] = useState(0)
  const [loading, setLoading]   = useState(true)
  const [from, setFrom]         = useState('')
  const [to, setTo]             = useState('')
  const [method, setMethod]     = useState('')
  const [historyModal, setHistoryModal] = useState(null)
  const [page, setPage]         = useState(1)
  const limit = 50

  const load = async () => {
    setLoading(true)
    try {
      const params = { limit, page }
      if (from) params.from = from
      if (to)   params.to   = to
      if (method) params.method = method
      const res = await getAllPayments(params)
      setPayments(Array.isArray(res.data?.data) ? res.data.data : [])
      setTotal(res.data?.total || 0)
      setTotalAmt(res.data?.totalAmount || 0)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [page, from, to, method])

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete entire payment of ₹${p.amountPaid} for ${p.customerName}?\n\nThis will reverse their validity by ${p.planMonths} month(s).`)) return
    try {
      await deletePayment(p._id)
      toast.success('Payment deleted')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
  }

  return (
    <div className="page !mt-0 !pt-0">
      {/* Top Section (Sticky Container) */}
      <div className="sticky top-0 z-40 bg-[var(--bg-base)] pb-3 -mt-4 pt-3 -mx-4 px-4 md:pb-4 md:-mt-8 md:pt-8 md:-mx-8 md:px-8 border-b border-[var(--border-color)] shadow-sm md:shadow-none">
        <div className="fade-up flex flex-wrap items-center justify-between gap-2 md:gap-3 mb-2 md:mb-1">
          <div>
            <h1 className="text-xl md:text-2xl" style={{ fontFamily:'Sora,sans-serif', fontWeight:800, color:'var(--text-base)' }}>{t('paymentHistory')}</h1>
            <p className="text-slate-600 dark:text-slate-400 font-medium" style={{ fontSize:13, marginTop:2 }}>{total} {t('totalRecords')}</p>
          </div>
          <div className="text-sm md:text-base" style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:'#34d399' }}>
            {t('total')}: ₹{totalAmt.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Filters */}
        <div className="fade-up stagger-1 mt-2 md:mt-4 flex flex-row gap-2 md:gap-3 items-end bg-[var(--surface2)] p-2 md:p-3 rounded-xl border border-[var(--border-color)]">
          <div className="flex-1">
            <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">{t('from')}</label>
            <input type="date" className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-base)] text-xs md:text-sm rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500/50" value={from} onChange={e=>setFrom(e.target.value)}/>
          </div>
          <div className="flex-1">
            <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">{t('to')}</label>
            <input type="date" className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-base)] text-xs md:text-sm rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500/50" value={to} onChange={e=>setTo(e.target.value)}/>
          </div>
          <div className="flex-1">
            <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">Method</label>
            <select className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-base)] text-xs md:text-sm rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer" value={method} onChange={e=>{setMethod(e.target.value); setPage(1)}}>
              <option value="">All</option>
              <option value="Cash">Cash</option>
              <option value="UPI/Online">UPI/Online</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block fade-up stagger-2 mt-6 rounded-2xl glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr className="tbl-head-row">
                {['#',t('customer'),'CAF',t('type'),t('amount'),t('months'),t('validTill'),t('paidOn'),t('notes'), t('actions')]
                  .map((h,i)=><th key={i} className="tbl-head">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_,i)=>(
                  <tr key={i} className="tbl-row">
                    {[...Array(10)].map((_,j)=><td key={j} className="tbl-cell"><div className="skeleton h-4 w-16 rounded"/></td>)}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign:'center', padding:'64px 0', color:'var(--text-muted)', fontSize:14 }}>
                  {t('noPaymentRecords')}
                </td></tr>
              ) : payments.map((p,i)=>(
                <tr key={p._id} className="tbl-row">
                  <td className="tbl-cell" style={{ color:'var(--text-dim)', fontFamily:'JetBrains Mono,monospace', fontSize:12 }}>{(page - 1) * limit + i + 1}</td>
                  <td className="tbl-cell font-semibold text-slate-900 dark:text-white">{p.customerName}</td>
                  <td className="tbl-cell text-slate-600 dark:text-slate-400" style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12 }}>{p.cafNumber}</td>
                  <td className="tbl-cell">
                    <span className={p.paymentType==='FULL'?'badge-paid':'badge-partial'}>{p.paymentType}</span>
                  </td>
                  <td className="tbl-cell font-semibold text-emerald-500" style={{ fontFamily:'JetBrains Mono,monospace' }}>
                    ₹{p.amountPaid.toLocaleString('en-IN')}
                  </td>
                  <td className="tbl-cell text-slate-600 dark:text-slate-400" style={{ fontFamily:'JetBrains Mono,monospace' }}>{p.planMonths}</td>
                  <td className="tbl-cell font-semibold text-[var(--text-base)]" style={{ fontSize:12, fontFamily:'JetBrains Mono,monospace' }}>
                    {p.validTill ? new Date(p.validTill).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) : 'NA'}
                  </td>
                  <td className="tbl-cell font-semibold text-[var(--text-base)]" style={{ fontSize:12 }}>{fmtDate(p.paymentDate)}</td>
                  <td className="tbl-cell italic text-slate-500" style={{ fontSize:12 }}>{p.notes||'NA'}</td>
                  <td className="tbl-cell">
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <button onClick={()=>setHistoryModal({ _id: p.customer, name: p.customerName, cafNumber: p.cafNumber })}
                        className="px-2 py-1 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        View
                      </button>
                      <button onClick={()=>handleDelete(p)}
                        style={{ padding:'5px 8px', borderRadius:8, cursor:'pointer', background:'transparent', border:'none', color:'var(--text-muted)', transition:'color 0.15s' }}
                        onMouseEnter={e=>e.target.style.color='#f87171'} onMouseLeave={e=>e.target.style.color='var(--text-muted)'} title="Delete Payment">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden fade-up stagger-2 flex flex-col gap-4 mt-6">
        {loading ? (
          [...Array(4)].map((_,i) => <div key={i} className="skeleton h-40 rounded-2xl w-full"/>)
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-[var(--surface2)] rounded-2xl border border-[var(--border-color)]">{t('noPaymentRecords')}</div>
        ) : payments.map((p) => {
          const isPartial = p.paymentType === 'PARTIAL';
          return (
            <div key={p._id} className={`relative p-4 rounded-xl border shadow-sm border-l-4 ${isPartial ? 'border-l-amber-500 bg-[var(--bg-surface)] border-[var(--border-color)]' : 'border-l-emerald-500 bg-[var(--bg-surface)] border-[var(--border-color)]'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-tight">{p.customerName}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-1">{p.cafNumber}</p>
                </div>
                <span className={isPartial ? 'badge-partial' : 'badge-paid'}>{p.paymentType}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-y-3 mb-4 text-sm mt-4">
                <div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold mb-0.5">Amount</p>
                  <p className="font-mono font-semibold text-emerald-500">₹{p.amountPaid.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold mb-0.5">Months</p>
                  <p className="font-mono font-medium text-slate-600 dark:text-slate-400">{p.planMonths}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold mb-0.5">Paid On</p>
                  <p className="font-mono font-semibold text-[var(--text-base)] text-xs">{fmtDate(p.paymentDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold mb-0.5">Valid Till</p>
                  <p className="font-mono font-semibold text-[var(--text-base)] text-xs">{p.validTill ? new Date(p.validTill).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) : 'NA'}</p>
                </div>
                {p.notes && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold mb-0.5">Notes</p>
                    <p className="text-xs italic text-slate-500">{p.notes}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[var(--border-color)] flex justify-end gap-2">
                <button onClick={()=>setHistoryModal({ _id: p.customer, name: p.customerName, cafNumber: p.cafNumber })} className="flex items-center gap-2 p-2.5 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-bold">
                  View History
                </button>
                <button onClick={()=>handleDelete(p)} className="flex items-center gap-2 p-2.5 rounded-lg text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors text-xs font-bold">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Pagination Controls */}
      {total > limit && (
        <div className="mt-4 p-4 rounded-xl border border-[var(--border-color)] flex flex-wrap gap-4 items-center justify-center sm:justify-start bg-[var(--surface2)]">
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Previous</button>
            <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Next</button>
          </div>
          <span style={{ fontSize:13, color:'var(--text-muted)' }}>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
          </span>
        </div>
      )}
      <PaymentHistoryModal 
        isOpen={!!historyModal} 
        onClose={() => setHistoryModal(null)} 
        customer={historyModal} 
      />
    </div>
  )
}
