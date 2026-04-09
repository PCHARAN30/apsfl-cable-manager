import { useEffect, useState } from 'react'
import { getAllPayments, deletePayment } from '../services/api'
import { useLang } from '../context/LanguageContext'
import toast from 'react-hot-toast'

const fmtDate = d => new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit',hour:'2-digit',minute:'2-digit'})

export default function Payments() {
  const { t } = useLang()
  const [payments, setPayments] = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [from, setFrom]         = useState('')
  const [to, setTo]             = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = { limit:200 }
      if (from) params.from = from
      if (to)   params.to   = to
      const res = await getAllPayments(params)
      setPayments(res.data.data); setTotal(res.data.total)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete payment of ₹${p.amountPaid} for ${p.customerName}?\n\nThis will recalculate the customer's balance.`)) return
    try {
      await deletePayment(p._id)
      toast.success('Payment deleted')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
  }

  const totalAmt = payments.reduce((s,p)=>s+p.amountPaid, 0)

  return (
    <div className="page">
      <div className="fade-up flex flex-wrap items-center justify-between gap-3" style={{ marginBottom:4 }}>
        <div>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:26, color:'var(--text-base)' }}>{t('paymentHistory')}</h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{total} {t('totalRecords')}</p>
        </div>
        <div style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, fontSize:16, color:'#34d399' }}>
          {t('total')}: ₹{totalAmt.toLocaleString('en-IN')}
        </div>
      </div>

      {/* Filters */}
      <div className="fade-up stagger-1 mt-6 flex flex-wrap gap-4 items-end glass-panel p-4 rounded-2xl">
        <div>
          <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5 }}>{t('from')}</label>
          <input type="date" className="w-full sm:w-auto bg-[var(--surface2)] border border-[var(--border-color)] text-[var(--text-base)] text-sm rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/50" value={from} onChange={e=>setFrom(e.target.value)}/>
        </div>
        <div>
          <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:5 }}>{t('to')}</label>
          <input type="date" className="w-full sm:w-auto bg-[var(--surface2)] border border-[var(--border-color)] text-[var(--text-base)] text-sm rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/50" value={to} onChange={e=>setTo(e.target.value)}/>
        </div>
        <button onClick={load} className="btn-primary">{t('filter')}</button>
        {(from||to) && <button onClick={()=>{ setFrom(''); setTo(''); setTimeout(load,100) }} className="btn-secondary">{t('clear')}</button>}
      </div>

      {/* Table */}
      <div className="fade-up stagger-2 mt-6 rounded-2xl glass-panel overflow-hidden">
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
                  <td className="tbl-cell" style={{ color:'var(--text-dim)', fontFamily:'JetBrains Mono,monospace', fontSize:12 }}>{i+1}</td>
                  <td className="tbl-cell" style={{ fontWeight:500, color:'var(--text-base)' }}>{p.customerName}</td>
                  <td className="tbl-cell" style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12 }}>{p.cafNumber}</td>
                  <td className="tbl-cell">
                    <span className={p.paymentType==='FULL'?'badge-paid':'badge-partial'}>{p.paymentType}</span>
                  </td>
                  <td className="tbl-cell" style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:700, color:'#34d399' }}>
                    ₹{p.amountPaid.toLocaleString('en-IN')}
                  </td>
                  <td className="tbl-cell" style={{ fontFamily:'JetBrains Mono,monospace' }}>{p.planMonths}</td>
                  <td className="tbl-cell" style={{ fontSize:12, fontFamily:'JetBrains Mono,monospace', color:'var(--text-muted)' }}>
                    {p.validTill ? new Date(p.validTill).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) : 'NA'}
                  </td>
                  <td className="tbl-cell" style={{ fontSize:12, color:'var(--text-muted)' }}>{fmtDate(p.paymentDate)}</td>
                  <td className="tbl-cell" style={{ fontSize:12, color:'var(--text-muted)' }}>{p.notes||'NA'}</td>
                  <td className="tbl-cell">
                    <button onClick={()=>handleDelete(p)}
                      style={{ padding:'5px 8px', borderRadius:8, cursor:'pointer', background:'transparent', border:'none', color:'var(--text-muted)', transition:'color 0.15s' }}
                      onMouseEnter={e=>e.target.style.color='#f87171'} onMouseLeave={e=>e.target.style.color='var(--text-muted)'} title="Delete Payment">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
