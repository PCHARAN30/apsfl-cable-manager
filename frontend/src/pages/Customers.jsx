import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getCustomers, markUnpaid, deleteCustomer } from '../services/api'
import { useLang } from '../context/LanguageContext'
import PaymentModal from '../components/PaymentModal'
import AddCustomerModal from '../components/AddCustomerModal'
import PaymentHistoryModal from '../components/PaymentHistoryModal'
import EditCustomerModal from '../components/EditCustomerModal'

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) : 'NA'

const StatusBadge = ({ status }) => {
  const cls = { PAID:'badge-paid', UNPAID:'badge-unpaid', PARTIAL:'badge-partial' }
  const dot = { PAID:'#15b070', UNPAID:'#ef4444', PARTIAL:'#f59e0b' }
  return (
    <span className={cls[status]||'badge-unpaid'}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:dot[status], display:'inline-block' }}/>
      {status}
    </span>
  )
}

export default function Customers() {
  const { t } = useLang()
  const [customers, setCustomers] = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('ALL')
  const [payModal, setPayModal]   = useState(null)
  const [addModal, setAddModal]   = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [historyModal, setHistoryModal] = useState(null)
  const [deleting, setDeleting]   = useState(null)
  const [page, setPage]           = useState(1)
  const limit = 50

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit, page }
      if (search) params.search = search
      if (statusFilter !== 'ALL') params.status = statusFilter
      const res = await getCustomers(params)
      setCustomers(res.data.data)
      setTotal(res.data.total)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [search, statusFilter, page])

  useEffect(() => { const t = setTimeout(load, 300); return ()=>clearTimeout(t) }, [load])

  const handleMarkUnpaid = async (c) => {
    try { await markUnpaid(c._id); toast.success('Marked UNPAID'); load() }
    catch { toast.error('Failed') }
  }

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete ${c.name}?`)) return
    setDeleting(c._id)
    try { await deleteCustomer(c._id); toast.success('Deleted'); load() }
    catch { toast.error('Delete failed') }
    finally { setDeleting(null) }
  }

  const TABS = ['ALL','PAID','UNPAID','PARTIAL']

  return (
    <div className="page">
      {/* Header */}
      <div className="fade-up flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:26, color:'var(--text-base)' }}>{t('customers')}</h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{total} {t('totalRecords')}</p>
        </div>
        <button onClick={() => setAddModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {t('addCustomer')}
        </button>
      </div>

      {/* Filters */}
      <div className="fade-up stagger-1 flex flex-col md:flex-row gap-4 mt-6">
        <div style={{ position:'relative', flex:1 }} className="w-full">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="w-full bg-[var(--surface2)] border border-[var(--border-color)] text-[var(--text-base)] text-sm rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent outline-none transition-all py-2.5 pr-4 pl-10 shadow-inner" placeholder={t('searchPlaceholder')}
          value={search} onChange={e=>{setSearch(e.target.value); setPage(1)}} />
        </div>
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl backdrop-blur-md">
          {TABS.map(s => (
          <button key={s} onClick={()=>{setStatus(s); setPage(1)}}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-200 ${statusFilter===s ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20' : 'text-[var(--text-muted)] hover:bg-[var(--border-color)] border border-transparent'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="fade-up stagger-2 mt-6 rounded-2xl glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr className="tbl-head-row">
                {['#',t('name'),t('cafNumber'),t('phone'),t('address'),t('plan'),t('status'),t('paidOn'),t('validTill'),t('balance'),t('actions')]
                  .map((h,i) => <th key={i} className="tbl-head">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_,i) => (
                  <tr key={i} className="tbl-row">
                    {[...Array(11)].map((_,j) => <td key={j} className="tbl-cell"><div className="skeleton h-4 w-16 rounded"/></td>)}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign:'center', padding:'64px 0', color:'var(--text-muted)', fontSize:14 }}>
                  {t('noCustomers')}
                </td></tr>
              ) : customers.map((c, idx) => {
                const days = c.validTill ? Math.ceil((new Date(c.validTill)-new Date())/86400000) : null
                const expiring = days !== null && days <= 5 && days > 0 && c.status !== 'UNPAID'
                return (
                  <tr key={c._id} className="tbl-row" style={expiring ? { background:'rgba(245,158,11,0.04)' } : {}}>
                    <td className="tbl-cell" style={{ color:'var(--text-dim)', fontFamily:'JetBrains Mono,monospace', fontSize:12 }}>{(page - 1) * limit + idx + 1}</td>
                    <td className="tbl-cell" style={{ fontWeight:500, color:'var(--text-base)' }}>
                      {c.name} <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:'normal', marginLeft:4 }}>({c.cafNumber})</span>
                      {expiring && <span style={{ marginLeft:6, fontSize:11, color:'#fbbf24', fontFamily:'JetBrains Mono,monospace' }}>⚠{days}d</span>}
                    </td>
                    <td className="tbl-cell" style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12 }}>{c.cafNumber}</td>
                    <td className="tbl-cell">{c.phone||'NA'}</td>
                    <td className="tbl-cell" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.address||'NA'}</td>
                    <td className="tbl-cell" style={{ fontFamily:'JetBrains Mono,monospace', color:'var(--text-base)' }}>₹{c.planAmount||300}</td>
                    <td className="tbl-cell"><StatusBadge status={c.status}/></td>
                    <td className="tbl-cell" style={{ fontSize:12, fontFamily:'JetBrains Mono,monospace' }}>{fmtDate(c.lastPaymentDate)}</td>
                    <td className="tbl-cell" style={{ fontSize:12, fontFamily:'JetBrains Mono,monospace', color: days&&days<0?'#f87171':'var(--text-muted)' }}>
                      {fmtDate(c.validTill)}
                    </td>
                    <td className="tbl-cell" style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, color:'#fbbf24' }}>
                      {c.carryOver>0 ? `₹${c.carryOver}` : <span style={{ color:'var(--text-dim)' }}>NA</span>}
                    </td>
                    <td className="tbl-cell">
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <button onClick={()=>setPayModal(c)}
                          style={{ padding:'5px 12px', fontSize:12, fontWeight:600, borderRadius:8, cursor:'pointer',
                            background:'rgba(21,176,112,0.12)', color:'#34d399', border:'1px solid rgba(21,176,112,0.2)',
                            transition:'all 0.15s' }}>
                          {t('pay')}
                        </button>
                        <button onClick={()=>setEditModal(c)}
                          style={{ padding:'5px 12px', fontSize:12, fontWeight:600, borderRadius:8, cursor:'pointer',
                            background:'rgba(245,158,11,0.1)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.2)',
                            transition:'all 0.15s' }}>
                          {t('edit')}
                        </button>
                        <button onClick={()=>setHistoryModal(c)}
                          style={{ padding:'5px 12px', fontSize:12, fontWeight:600, borderRadius:8, cursor:'pointer',
                            background:'rgba(59,130,246,0.1)', color:'#60a5fa', border:'1px solid rgba(59,130,246,0.2)',
                            transition:'all 0.15s' }}>
                          View
                        </button>
                        <button onClick={()=>handleDelete(c)} disabled={deleting===c._id}
                          style={{ padding:'5px 8px', borderRadius:8, cursor:'pointer', background:'transparent', border:'none', color:'var(--text-muted)', transition:'color 0.15s' }}
                          onMouseEnter={e=>e.target.style.color='#f87171'} onMouseLeave={e=>e.target.style.color='var(--text-muted)'}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {total > limit && (
          <div className="p-4 border-t border-[var(--border-color)] flex flex-wrap gap-4 items-center justify-between bg-[var(--surface2)]">
            <span style={{ fontSize:13, color:'var(--text-muted)' }}>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Previous</button>
              <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Next</button>
            </div>
          </div>
        )}
      </div>

      {payModal && <PaymentModal customer={payModal} onClose={()=>setPayModal(null)} onSuccess={load}/>}
      {addModal && <AddCustomerModal onClose={()=>setAddModal(false)} onSuccess={load}/>}
      {editModal && <EditCustomerModal customer={editModal} onClose={()=>setEditModal(null)} onSuccess={load}/>}
      <PaymentHistoryModal 
        isOpen={!!historyModal} 
        onClose={() => setHistoryModal(null)} 
        customer={historyModal} 
      />
    </div>
  )
}
