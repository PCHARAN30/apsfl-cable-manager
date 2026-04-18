import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getCustomers, markUnpaid, deleteCustomer, bulkDeleteCustomers, getPonStats } from '../services/api'
import { useLang } from '../context/LanguageContext'
import PaymentModal from '../components/PaymentModal'
import AddCustomerModal from '../components/AddCustomerModal'
import ViewCustomerModal from '../components/ViewCustomerModal'
import EditCustomerModal from '../components/EditCustomerModal'

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) : 'NA'

const StatusBadge = ({ status }) => {
  const cls = { PAID:'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20', UNPAID:'bg-red-500/10 text-red-500 border border-red-500/20', PARTIAL:'bg-amber-500/10 text-amber-500 border border-amber-500/20' }
  const dot = { PAID:'#22C55E', UNPAID:'#EF4444', PARTIAL:'#F59E0B' }
  return (
    <span className={`px-2 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 w-max ${cls[status]||cls.UNPAID}`}>
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
  const [ponFilter, setPonFilter] = useState('')
  const [availablePons, setAvailablePons] = useState([])
  const [ponStats, setPonStats]   = useState(new Map())
  const [payModal, setPayModal]   = useState(null)
  const [addModal, setAddModal]   = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [viewModal, setViewModal] = useState(null)
  const [deleting, setDeleting]   = useState(null)
  const [page, setPage]           = useState(1)
  const limit = 50

  const [selectedIds, setSelectedIds] = useState([])
  const [isDeleting, setIsDeleting] = useState(false)

  const loadPonStats = () => {
    getPonStats()
      .then(res => {
        const data = res.data.data.filter(s => s.ponNumber != null && String(s.ponNumber).trim() !== '');
        setAvailablePons(data.map(s => String(s.ponNumber)));
        setPonStats(new Map(data.map(s => [String(s.ponNumber), s.used])));
      })
      .catch(() => {})
  }

  useEffect(() => {
    loadPonStats()
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit, page }
      if (search) params.search = search
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (ponFilter) params.pon = ponFilter
      const res = await getCustomers(params)
      setCustomers(res.data.data)
      setTotal(res.data.total)
      setSelectedIds([]) // Clear selection on page/filter change
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [search, statusFilter, ponFilter, page])

  useEffect(() => { const t = setTimeout(load, 300); return ()=>clearTimeout(t) }, [load])

  const handleMarkUnpaid = async (c) => {
    try { await markUnpaid(c._id); toast.success('Marked UNPAID'); load() }
    catch { toast.error('Failed') }
  }

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete ${c.name}?`)) return
    setDeleting(c._id)
    try { await deleteCustomer(c._id); toast.success('Deleted'); load(); loadPonStats(); }
    catch { toast.error('Delete failed') }
    finally { setDeleting(null) }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(customers.map(c => c._id))
    else setSelectedIds([])
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected customers?\nThis action and their associated payments cannot be undone.`)) {
      return
    }
    setIsDeleting(true)
    try {
      await bulkDeleteCustomers({ ids: selectedIds })
      toast.success(`${selectedIds.length} customers deleted successfully`)
      setSelectedIds([])
      load()
      loadPonStats()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customers')
    } finally {
      setIsDeleting(false)
    }
  }

  const TABS = ['ALL','PAID','UNPAID','PARTIAL']

  return (
    <div className="page !mt-0 !pt-0">
      {/* WhatsApp-style Sticky Mobile Header (Search + Tabs) */}
      <div className="md:hidden sticky top-14 z-30 -mx-4 mb-4 !mt-0 !pt-0 flex flex-col shadow-md">
        {/* Search Bar */}
        <div className="bg-[#075E54] dark:bg-slate-800 px-4 py-2 transition-colors">
          <div className="relative w-full">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-100/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className="w-full bg-black/10 dark:bg-black/20 border border-transparent text-white placeholder-emerald-100/70 text-sm rounded-xl focus:bg-black/20 focus:border-emerald-400/30 outline-none transition-all py-2.5 pr-4 pl-10 shadow-inner" placeholder="Search by name, CAF, phone..."
            value={search} onChange={e=>{setSearch(e.target.value); setPage(1)}} />
          </div>
        </div>
        {/* Tabs */}
        <div className="bg-[#075E54] dark:bg-slate-800 flex text-emerald-50 transition-colors">
          {TABS.map(s => (
            <button 
              key={s} 
              onClick={()=>{setStatus(s); setPage(1)}}
              className={`flex-1 py-3 text-sm font-bold text-center transition-all duration-200 border-b-4 ${statusFilter === s ? 'border-white text-white' : 'border-transparent text-emerald-100/70 hover:text-white'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="hidden md:flex fade-up flex-wrap items-center justify-between gap-3">
        <div>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:26, color:'var(--text-base)' }}>{t('customers')}</h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{total} {t('totalRecords')}</p>
        </div>
        <button onClick={() => setAddModal(true)} className="hidden md:flex btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {t('addCustomer')}
        </button>
      </div>

      {/* Filters */}
      <div className="fade-up stagger-1 flex flex-col md:flex-row gap-4 mt-2 md:mt-6">
        <div style={{ position:'relative', flex:1 }} className="hidden md:block w-full">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="w-full bg-[var(--surface2)] border border-[var(--border-color)] text-[var(--text-base)] text-sm rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent outline-none transition-all py-2.5 pr-4 pl-10 shadow-inner" placeholder="Search by name, CAF, phone..."
          value={search} onChange={e=>{setSearch(e.target.value); setPage(1)}} />
        </div>
        
        {/* PON Filter Dropdown */}
        <div className="relative w-max md:w-auto">
          <select
            value={ponFilter}
            onChange={(e) => { setPonFilter(e.target.value); setPage(1); }}
            className="appearance-none h-full bg-[var(--surface2)] border border-[var(--border-color)] text-[var(--text-base)] text-xs md:text-sm rounded-full md:rounded-xl pl-9 md:pl-4 pr-9 md:pr-10 py-2 md:py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer font-bold md:font-medium shadow-sm md:shadow-inner transition-all"
          >
            <option value="">All PONs</option>
            {availablePons.map(pon => (
              <option key={pon} value={pon}>{pon} ({ponStats.get(pon) || 0}/128)</option>
            ))}
          </select>
          <div className="absolute inset-y-0 left-3 md:hidden flex items-center pointer-events-none text-emerald-500">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden md:flex fade-up stagger-1 w-full border-b border-[var(--border-color)] mt-4">
        {TABS.map(s => (
          <button 
            key={s} 
            onClick={()=>{setStatus(s); setPage(1)}}
            className={`flex-1 py-3 text-sm font-bold text-center transition-all duration-200 border-b-2 ${statusFilter === s ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-base)]'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fade-up flex items-center gap-4 bg-red-500/10 border border-red-500/20 p-3 rounded-xl mt-6">
          <span className="text-red-400 font-semibold text-sm pl-2">
            {selectedIds.length} customers selected
          </span>
          <button 
            onClick={handleBulkDelete} 
            disabled={isDeleting}
            className="btn-primary bg-red-500 hover:bg-red-600 text-white ml-auto border-none"
          >
            {isDeleting ? 'Deleting...' : 'Delete Selected'}
          </button>
        </div>
      )}

      {/* Desktop Table View */}
      <div className={`hidden md:block fade-up stagger-2 ${selectedIds.length > 0 ? 'mt-4' : 'mt-6'} rounded-2xl glass-panel overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr className="tbl-head-row">
                <th className="tbl-head" style={{ width: 40, textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--surface2)] text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    onChange={toggleSelectAll}
                    checked={customers.length > 0 && selectedIds.length === customers.length}
                  />
                </th>
                {['#',t('name'),t('cafNumber'),t('phone'),t('address'),t('plan'),t('status'),t('paidOn'),t('validTill'),t('balance'),t('actions')]
                  .map((h,i) => <th key={i} className="tbl-head">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_,i) => (
                  <tr key={i} className="tbl-row">
                    <td className="tbl-cell"><div className="skeleton h-4 w-4 rounded mx-auto"/></td>
                    {[...Array(11)].map((_,j) => <td key={j} className="tbl-cell"><div className="skeleton h-4 w-16 rounded"/></td>)}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr><td colSpan={12} style={{ textAlign:'center', padding:'64px 0', color:'var(--text-muted)', fontSize:14 }}>
                  {t('noCustomers')}
                </td></tr>
              ) : customers.map((c, idx) => {
                const days = c.validTill ? Math.ceil((new Date(c.validTill)-new Date())/86400000) : null
                const expiring = days !== null && days <= 5 && days > 0 && c.status !== 'UNPAID'
                const isExpired = (c.status === 'UNPAID' && c.validTill !== null) || (c.validTill && new Date(c.validTill) < new Date(new Date().setHours(0,0,0,0)))
                
                return (
                  <tr key={c._id} className={`tbl-row border-l-4 ${isExpired ? 'bg-red-500/10 border-red-500' : expiring ? 'bg-amber-500/10 border-amber-500' : 'border-transparent'}`}>
                    <td className="tbl-cell" style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--surface2)] text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                        checked={selectedIds.includes(c._id)}
                        onChange={() => toggleSelect(c._id)}
                      />
                    </td>
                    <td className="tbl-cell" style={{ color:'var(--text-dim)', fontFamily:'JetBrains Mono,monospace', fontSize:12 }}>{(page - 1) * limit + idx + 1}</td>
                    <td className="tbl-cell" style={{ fontWeight:500, color:'var(--text-base)' }}>
                      {c.name}
                      {expiring && <span style={{ marginLeft:6, fontSize:11, color:'#fbbf24', fontFamily:'JetBrains Mono,monospace' }}>⚠{days}d</span>}
                    </td>
                    <td className="tbl-cell" style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12 }}>{c.cafNumber}</td>
                    <td className="tbl-cell">{c.phone||'NA'}</td>
                    <td className="tbl-cell" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.address||'NA'}</td>
                    <td className="tbl-cell" style={{ fontFamily:'JetBrains Mono,monospace', color:'var(--text-base)' }}>₹{c.planAmount||291}</td>
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
                        <button onClick={()=>setPayModal(c)} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-[#22C55E] hover:bg-green-700 transition-colors">
                          {t('pay')}
                        </button>
                        <button onClick={()=>setEditModal(c)} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors">
                          {t('edit')}
                        </button>
                        <button onClick={()=>setViewModal(c)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
                        >
                          Details
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
      </div>

      {/* Mobile Card View */}
      <div className={`md:hidden fade-up stagger-2 flex flex-col gap-4 ${selectedIds.length > 0 ? 'mt-4' : 'mt-6'}`}>
        {loading ? (
          [...Array(4)].map((_,i) => <div key={i} className="skeleton h-40 rounded-2xl w-full"/>)
        ) : customers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-[var(--surface2)] rounded-2xl border border-[var(--border-color)]">{t('noCustomers')}</div>
        ) : customers.map((c) => {
          const days = c.validTill ? Math.ceil((new Date(c.validTill)-new Date())/86400000) : null
          const expiring = days !== null && days <= 5 && days > 0 && c.status !== 'UNPAID'
          const isExpired = (c.status === 'UNPAID' && c.validTill !== null) || (c.validTill && new Date(c.validTill) < new Date(new Date().setHours(0,0,0,0)))
          
          return (
            <div key={c._id} className={`relative p-4 rounded-xl border shadow-sm border-l-4 ${isExpired ? 'border-l-red-500 bg-red-500/10 border-red-500/20' : expiring ? 'border-l-amber-500 bg-amber-500/10 border-amber-500/20' : 'border-l-emerald-500 bg-[var(--bg-surface)] border-[var(--border-color)]'}`}>
              {/* Top: Name & Checkbox */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 mt-0.5 rounded border-[var(--border-color)] bg-[var(--surface2)] text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    checked={selectedIds.includes(c._id)}
                    onChange={() => toggleSelect(c._id)}
                  />
                  <div>
                    <h3 className="font-bold text-[var(--text-base)] text-base leading-tight">{c.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">{c.cafNumber} {c.phone && `| 📞 ${c.phone}`}</p>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              
              {/* Middle: Details */}
              <div className="grid grid-cols-2 gap-y-3 mb-4 text-sm mt-4 pl-7">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Package</p>
                  <p className="font-mono font-medium text-[var(--text-base)]">₹{c.planAmount||291} <span className="text-xs text-slate-400">| PON: {c.ponNumber||'NA'}</span></p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Balance</p>
                  <p className="font-mono font-medium text-amber-500">{c.carryOver>0 ? `₹${c.carryOver}` : 'Nil'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Paid On</p>
                  <p className="font-mono text-slate-600 dark:text-slate-300">{fmtDate(c.lastPaymentDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Valid Till</p>
                  <p className={`font-mono ${isExpired ? 'text-red-500 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>{fmtDate(c.validTill)}</p>
                </div>
              </div>

              {/* Bottom: Actions */}
              <div className="pt-4 border-t border-[var(--border-color)]">
                <button onClick={()=>setPayModal(c)} className="w-full py-3 mb-3 text-sm font-bold rounded-xl text-white bg-[#22C55E] hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                  {t('pay')}
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={()=>setEditModal(c)} className="flex-1 py-2.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                    {t('edit')}
                  </button>
                  <button onClick={()=>setViewModal(c)} className="flex-1 py-2.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Details
                  </button>
                  <button onClick={()=>handleDelete(c)} disabled={deleting===c._id} className="p-2.5 rounded-lg text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination Controls */}
      {total > limit && (
        <div className="mt-4 p-4 rounded-xl border border-[var(--border-color)] flex flex-wrap gap-4 items-center justify-between bg-[var(--surface2)]">
          <span style={{ fontSize:13, color:'var(--text-muted)' }}>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Previous</button>
            <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Next</button>
          </div>
        </div>
      )}

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={() => setAddModal(true)}
        className="md:hidden fixed bottom-20 right-5 z-40 w-14 h-14 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full shadow-lg shadow-green-500/40 flex items-center justify-center active:scale-90 transition-all"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {payModal && <PaymentModal customer={payModal} onClose={()=>setPayModal(null)} onSuccess={load}/>}
      {addModal && <AddCustomerModal onClose={()=>setAddModal(false)} onSuccess={() => { load(); loadPonStats(); }} ponStats={ponStats}/>}
      {editModal && <EditCustomerModal customer={editModal} onClose={()=>setEditModal(null)} onSuccess={() => { load(); loadPonStats(); }} ponStats={ponStats}/>}
      {viewModal && <ViewCustomerModal customer={viewModal} onClose={() => setViewModal(null)} />}
    </div>
  )
}
