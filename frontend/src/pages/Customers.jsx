import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getCustomers, markUnpaid, deleteCustomer, bulkDeleteCustomers, getPonStats } from '../services/api'
import { useLang } from '../context/LanguageContext'
import PaymentModal from '../components/PaymentModal'
import AddCustomerModal from '../components/AddCustomerModal'
import ViewCustomerModal from '../components/ViewCustomerModal'
import EditCustomerModal from '../components/EditCustomerModal'

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) : 'NA'

const StatusBadge = ({ status, validTill, rightAlign = false }) => {
  const cls = { PAID:'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20', UNPAID:'bg-red-500/10 text-red-500 border border-red-500/20', PARTIAL:'bg-amber-500/10 text-amber-500 border border-amber-500/20' }
  const dot = { PAID:'#22C55E', UNPAID:'#EF4444', PARTIAL:'#F59E0B' }
  
  let expiredDays = 0;
  if (status === 'UNPAID' && validTill) {
    const today = new Date();
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const vt = new Date(validTill);
    const validTillNormalized = new Date(vt.getFullYear(), vt.getMonth(), vt.getDate());
    expiredDays = Math.floor((todayNormalized - validTillNormalized) / 86400000);
  }

  return (
    <div className={`flex flex-col gap-1.5 ${rightAlign ? 'items-end' : 'items-start'}`}>
      <span className={`px-2 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 w-max ${cls[status]||cls.UNPAID}`}>
        <span style={{ width:5, height:5, borderRadius:'50%', background:dot[status], display:'inline-block' }}/>
        {status}
      </span>
      {expiredDays > 0 && (
        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded tracking-tight whitespace-nowrap">
          Expired {expiredDays} day{expiredDays > 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}

export default function Customers() {
  const navigate = useNavigate()
  const { t } = useLang()
  const [customers, setCustomers] = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
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
  const [deleteMode, setDeleteMode] = useState(false)

  const loadPonStats = () => {
    getPonStats()
      .then(res => {
        const rawData = Array.isArray(res.data?.data) ? res.data.data : [];
        const data = rawData.filter(s => s.ponNumber != null && String(s.ponNumber).trim() !== '');
        setAvailablePons(data.map(s => String(s.ponNumber)));
        setPonStats(new Map(data.map(s => [String(s.ponNumber), s.used])));
      })
      .catch(() => {})
  }

  useEffect(() => {
    loadPonStats()
    
    const handleToggle = () => setDeleteMode(prev => {
      if (prev) setSelectedIds([]); // Clear selection when turning off
      return !prev;
    });
    window.addEventListener('toggle-delete-mode', handleToggle);
    return () => window.removeEventListener('toggle-delete-mode', handleToggle);
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit, page }
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (ponFilter) params.pon = ponFilter
      const res = await getCustomers(params)
      setCustomers(Array.isArray(res.data?.data) ? res.data.data : [])
      setTotal(res.data?.total || 0)
      setSelectedIds([]) // Clear selection on page/filter change
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [statusFilter, ponFilter, page])

  useEffect(() => { load() }, [load])

  const handleMarkUnpaid = async (c) => {
    if (!window.confirm(`Are you sure you want to mark ${c.name} as UNPAID?\n\nThis will revert their validity back to their previous unpaid date.`)) return;
    try { await markUnpaid(c._id); toast.success('Reverted to previous state'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to revert') }
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
      setDeleteMode(false)
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
      {/* Top Section */}
      <div className="bg-[var(--bg-base)] pb-3 -mt-3 pt-0 -mx-3 px-3 md:sticky md:top-0 md:z-40 md:pb-4 md:-mt-8 md:pt-8 md:-mx-8 md:px-8 border-b border-[var(--border-color)] md:border-none shadow-sm md:shadow-none mb-3 md:mb-0 transition-all">
          <div className="fade-in flex flex-col">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 md:pt-0">
              <div>
                <h1 style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:26, color:'var(--text-base)' }}>{t('customers')}</h1>
                <p className="text-slate-600 dark:text-slate-400 font-medium" style={{ fontSize:13, marginTop:2 }}>{total} {t('totalRecords')}</p>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <button onClick={() => navigate('/search')} className="btn-secondary">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Search
                </button>
                <button onClick={() => setAddModal(true)} className="btn-primary">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  {t('addCustomer')}
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto custom-scrollbar pb-2 w-full">
              {TABS.map(s => (
                <button 
                  key={s} 
                  onClick={()=>{setStatus(s); setPage(1)}}
                  className={`px-3 py-1.5 shrink-0 rounded-full text-xs font-bold text-center transition-all duration-200 whitespace-nowrap ${statusFilter === s ? 'bg-emerald-500 text-white shadow-md scale-105' : 'bg-[var(--surface2)] text-[var(--text-muted)] border border-[var(--border-color)] hover:bg-[var(--border-color)] hover:text-[var(--text-base)]'}`}
                >
                  {s}
                </button>
              ))}
              <div className="relative shrink-0 ml-1">
                <select
                  value={ponFilter}
                  onChange={(e) => { setPonFilter(e.target.value); setPage(1); }}
                  className="appearance-none bg-[var(--surface2)] border border-[var(--border-color)] text-[var(--text-base)] text-xs rounded-full pl-3 pr-7 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer font-bold shadow-sm transition-all"
                >
                  <option value="">All PONs</option>
                  {availablePons.map(pon => (
                    <option key={pon} value={pon}>{pon} ({ponStats.get(pon) || 0})</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* Bulk Actions Bar */}
      {deleteMode && (
        <div className="fade-up flex flex-wrap items-center gap-3 bg-red-500/10 border border-red-500/20 p-3 rounded-xl mt-6">
          <button onClick={() => setSelectedIds(customers.map(c => c._id))} className="px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Select All</button>
          <button onClick={() => setSelectedIds([])} className="px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Deselect All</button>
          <span className="text-red-500 dark:text-red-400 font-semibold text-sm pl-1">
            {selectedIds.length} selected
          </span>
          <button 
            onClick={handleBulkDelete} 
            disabled={isDeleting || selectedIds.length === 0}
            className="btn-primary bg-red-500 hover:bg-red-600 text-white ml-auto border-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete Selected'}
          </button>
        </div>
      )}

      {/* Desktop Table View */}
      <div className={`hidden md:block fade-up stagger-2 ${deleteMode ? 'mt-4' : 'mt-6'} rounded-2xl glass-panel overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr className="tbl-head-row">
                {deleteMode && (
                  <th className="tbl-head" style={{ width: 40, textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--surface2)] text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                      onChange={toggleSelectAll}
                      checked={customers.length > 0 && selectedIds.length === customers.length}
                    />
                  </th>
                )}
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
                
                return (
                  <tr key={c._id} className={`tbl-row border-l-4 ${c.status === 'PAID' ? 'bg-emerald-500/10 border-emerald-500' : c.status === 'PARTIAL' ? 'bg-amber-500/10 border-amber-500' : 'bg-red-500/10 border-red-500'}`}>
                    {deleteMode && (
                      <td className="tbl-cell" style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox"
                          className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--surface2)] text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                          checked={selectedIds.includes(c._id)}
                          onChange={() => toggleSelect(c._id)}
                        />
                      </td>
                    )}
                    <td className="tbl-cell" style={{ color:'var(--text-dim)', fontFamily:'JetBrains Mono,monospace', fontSize:12 }}>{(page - 1) * limit + idx + 1}</td>
                    <td className="tbl-cell" style={{ fontWeight:800, color:'var(--text-base)', fontSize: 16 }}>
                  <span className="text-emerald-600 dark:text-emerald-500 font-mono text-sm mr-1">#{c.serialNumber}</span> {c.name}
                      {expiring && <span style={{ marginLeft:6, fontSize:11, color:'#fbbf24', fontFamily:'JetBrains Mono,monospace' }}>⚠{days}d</span>}
                    </td>
                    <td className="tbl-cell font-bold text-[var(--text-base)]" style={{ fontFamily:'JetBrains Mono,monospace', fontSize:15 }}>
                      {c.cafNumber}
                    </td>
                    <td className="tbl-cell font-bold text-[var(--text-base)]" style={{ fontSize:15 }}>
                      {c.phone || 'NA'}
                    </td>
                    <td className="tbl-cell font-medium text-slate-600 dark:text-slate-400" style={{ fontSize: 12 }}>{c.address||'NA'}</td>
                    <td className="tbl-cell" style={{ fontFamily:'JetBrains Mono,monospace', color:'var(--text-base)' }}>₹{c.planAmount||291}</td>
                    <td className="tbl-cell"><StatusBadge status={c.status} validTill={c.validTill}/></td>
                    <td className="tbl-cell font-semibold text-[var(--text-base)]" style={{ fontSize:12, fontFamily:'JetBrains Mono,monospace' }}>{fmtDate(c.lastPaymentDate)}</td>
                    <td className={`tbl-cell font-semibold ${days&&days<0 ? 'text-red-500' : 'text-[var(--text-base)]'}`} style={{ fontSize:12, fontFamily:'JetBrains Mono,monospace' }}>
                      {fmtDate(c.validTill)}
                    </td>
                    <td className="tbl-cell" style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, color:'#fbbf24' }}>
                      {c.carryOver>0 ? `₹${c.carryOver}` : <span className="text-slate-500 dark:text-slate-400 font-medium">NA</span>}
                    </td>
                    <td className="tbl-cell">
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <button onClick={()=>setPayModal(c)} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-[#22C55E] hover:bg-green-700 transition-colors">
                          {t('pay')}
                        </button>
                    {c.status !== 'UNPAID' && (
                      <button onClick={()=>handleMarkUnpaid(c)} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors" title="Mark Unpaid">
                        Unpaid
                      </button>
                    )}
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
      <div className={`md:hidden fade-up stagger-2 flex flex-col gap-4 ${deleteMode ? 'mt-4' : 'mt-6'}`}>
        {loading ? (
          [...Array(4)].map((_,i) => <div key={i} className="skeleton h-40 rounded-2xl w-full"/>)
        ) : customers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-[var(--surface2)] rounded-2xl border border-[var(--border-color)]">{t('noCustomers')}</div>
        ) : customers.map((c) => {
          const days = c.validTill ? Math.ceil((new Date(c.validTill)-new Date())/86400000) : null
          const expiring = days !== null && days <= 5 && days > 0 && c.status !== 'UNPAID'
          const isExpired = (c.status === 'UNPAID' && c.validTill !== null) || (c.validTill && new Date(c.validTill) < new Date(new Date().setHours(0,0,0,0)))
          
          return (
            <div key={c._id} className={`relative p-3 rounded-xl border shadow-sm border-l-4 ${c.status === 'PAID' ? 'border-l-emerald-500 bg-emerald-500/10 border-emerald-500/20' : c.status === 'PARTIAL' ? 'border-l-amber-500 bg-amber-500/10 border-amber-500/20' : 'border-l-red-500 bg-red-500/10 border-red-500/20'}`}>
              {/* Top: Name & Checkbox */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-3">
                  {deleteMode && (
                    <input 
                      type="checkbox"
                      className="w-4 h-4 mt-0.5 rounded border-[var(--border-color)] bg-[var(--surface2)] text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                      checked={selectedIds.includes(c._id)}
                      onChange={() => toggleSelect(c._id)}
                    />
                  )}
                  <div>
                <h3 className="font-extrabold text-[var(--text-base)] text-lg leading-tight mb-1 flex items-center gap-1.5">
                  <span className="text-emerald-600 dark:text-emerald-500 font-mono text-xs bg-emerald-500/10 px-1.5 py-0.5 rounded">#{c.serialNumber}</span> {c.name}
                    </h3>
                    <p className="text-sm text-[var(--text-base)] font-bold font-mono">
                      {c.cafNumber}
                      {c.phone && <> <span className="mx-1 text-[var(--text-muted)]">|</span> 📞 {c.phone}</>}
                    </p>
                  </div>
                </div>
                <StatusBadge status={c.status} validTill={c.validTill} rightAlign={true} />
              </div>
              
              {/* Middle: Details */}
              <div className="grid grid-cols-2 gap-y-3 mb-4 text-sm mt-4 pl-7">
                <div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold mb-0.5">Package</p>
                  <p className="font-mono font-medium text-[var(--text-base)]">₹{c.planAmount||291} <span className="text-xs text-slate-400">| PON: {c.ponNumber||'NA'}</span></p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold mb-0.5">Balance</p>
                  <p className="font-mono font-medium text-amber-500">{c.carryOver>0 ? `₹${c.carryOver}` : 'Nil'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold mb-0.5">Paid On</p>
                  <p className="font-mono font-semibold text-[var(--text-base)]">{fmtDate(c.lastPaymentDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold mb-0.5">Valid Till</p>
                  <p className={`font-mono font-semibold ${isExpired ? 'text-red-500' : 'text-[var(--text-base)]'}`}>{fmtDate(c.validTill)}</p>
                </div>
              </div>

              {/* Bottom: Actions */}
              <div className="pt-4 border-t border-[var(--border-color)]">
                <div className="flex gap-2 mb-3">
                  <button onClick={()=>setPayModal(c)} className="flex-1 py-3 text-sm font-bold rounded-xl text-white bg-[#22C55E] hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                    {t('pay')}
                  </button>
                  {c.status !== 'UNPAID' && (
                    <button onClick={()=>handleMarkUnpaid(c)} className="px-4 py-3 text-sm font-bold rounded-xl text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-center" title="Mark Unpaid">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  )}
                </div>
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

      {/* Floating Search Button (Mobile) */}
      <button
        onClick={() => navigate('/search')}
        className="md:hidden fixed bottom-[140px] right-4 z-40 w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-lg shadow-black/10 flex items-center justify-center active:scale-90 transition-all"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={() => setAddModal(true)}
        className="md:hidden fixed bottom-[80px] right-4 z-40 w-12 h-12 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl shadow-lg shadow-green-500/40 flex items-center justify-center active:scale-90 transition-all"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
