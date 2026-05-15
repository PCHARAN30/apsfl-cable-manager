import { useEffect, useState } from 'react'
import { getDashboardStats, getExpiringCustomers, resetDashboard } from '../services/api'
import { useLang } from '../context/LanguageContext'
import toast from 'react-hot-toast'
import PonDashboard from '../components/PonDashboard'
import ErrorBoundary from '../components/ErrorBoundary'

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) : '—'

const fmt = (n) => `₹${Number(n||0).toLocaleString('en-IN')}`

export default function Dashboard() {
  const { t } = useLang()
  const [stats, setStats]       = useState(null)
  const [expiring, setExpiring] = useState([])
  const [loading, setLoading]   = useState(true)
  const [resetting, setResetting] = useState(false)

  const load = async () => {
    try {
      const [s, e] = await Promise.all([
        getDashboardStats(), getExpiringCustomers(7)
      ])
      
      let baseStats = s.data?.data || {};
      
      // Optimistic offline adjustments
      const storedQueue = JSON.parse(localStorage.getItem('offline_payments') || '[]');
      const queue = Array.isArray(storedQueue) ? storedQueue : [];
      if (queue?.length > 0) {
        let offlineRevenue = 0;
        queue.forEach(item => {
          offlineRevenue += Number(item.payload?.amountPaid || 0);
        });
        baseStats = {
          ...baseStats,
          dailyIncome: (baseStats.dailyIncome || 0) + offlineRevenue,
          monthlyIncome: (baseStats.monthlyIncome || 0) + offlineRevenue,
          totalToReceive: Math.max(0, (baseStats.totalToReceive || 0) - offlineRevenue)
        };
      }
      
      setStats(baseStats)
      setExpiring(Array.isArray(e.data?.data) ? e.data.data : [])
    } catch (error) { 
      console.error("Failed to load dashboard data:", error)
    }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleReset = async () => {
    if (!window.confirm(t('resetConfirm'))) return
    setResetting(true)
    try {
      await resetDashboard()
      toast.success(t('resetSuccess'))
      await load()
    } catch { toast.error('Reset failed') }
    finally { setResetting(false) }
  }

  if (loading) return <SkeletonDash />

  const paid    = stats?.paidCount    || 0
  const unpaid  = stats?.unpaidCount  || 0
  const partial = stats?.partialCount || 0
  const total   = stats?.totalCustomers || 0
  const paidPct = total ? Math.round((paid/total)*100) : 0
  
  const unpaidToReceive = stats?.unpaidToReceive || 0;
  const partialToReceive = stats?.partialToReceive || 0;
  const toReceiveTooltip = `${unpaid} unpaid customers: ${fmt(unpaidToReceive)}\n${partial} partial customers: ${fmt(partialToReceive)}`;

  const topCards = [
    { label: t('totalCustomers'), value: total,                     color: '#3b82f6', icon: IcoUsers,  sub: `Active: ${paid + partial}, Expired: ${unpaid}` },
    { label: t('toReceive'),      value: fmt(stats?.totalToReceive), color: '#ef4444', icon: IcoAlert, sub: `${unpaid} unpaid + ${partial} partial`, tooltip: toReceiveTooltip },
    { label: t('todaysIncome'),   value: fmt(stats?.dailyIncome),    color: '#22C55E', icon: IcoCoins, sub: new Date().toLocaleDateString('en-IN') },
    { label: t('monthlyIncome'),  value: fmt(stats?.monthlyIncome),  color: '#F97316', icon: IcoChart, sub: new Date().toLocaleString('en-IN',{month:'long'}) },
  ]
  const bottomCards = [
    { label: t('paid'),    value: paid,    color: '#22C55E', sub: t('activeSubscriptions') },
    { label: t('unpaid'),  value: unpaid,  color: '#ef4444', sub: t('needToCollect') },
    { label: t('partial'), value: partial, color: '#f59e0b', sub: t('balancePending') },
  ]

  return (
    <div className="page">
      {/* Header */}
      <div className="fade-up flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:26, color:'var(--text-base)' }}>{t('dashboard')}</h1>
          <p className="text-[var(--text-muted)] font-medium" style={{ fontSize:13, marginTop:2 }}>
            {new Date().toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </p>
        </div>
        <button onClick={handleReset} disabled={resetting} className="btn-danger text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
          </svg>
          {resetting ? '...' : t('resetDashboard')}
        </button>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
        {topCards.map((c, i) => (
        <div key={i} className={`p-6 sm:p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-md fade-up stagger-${i+1}`} title={c.tooltip}>
            <div className="flex items-start justify-between mb-3">
            <p className="text-slate-600 dark:text-slate-400" style={{ fontSize:13, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>{c.label}</p>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:`${c.color}18` }}>
                <c.icon color={c.color} />
              </div>
            </div>
          <p className="count-up" style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:32, color:c.color, marginTop:8 }}>{c.value}</p>
          <p className="text-slate-600 dark:text-slate-400" style={{ fontSize:13, marginTop:6, fontWeight:500 }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Bottom stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
        {bottomCards.map((c, i) => (
        <div key={i} className={`p-6 sm:p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-md fade-up stagger-${i+5}`}>
          <p className="text-slate-600 dark:text-slate-400" style={{ fontSize:13, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>{c.label}</p>
          <p style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:36, color:c.color }}>{c.value}</p>
          <p className="text-slate-600 dark:text-slate-400" style={{ fontSize:14, marginTop:4, fontWeight:500 }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Expiring soon & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Expiring soon */}
        <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-sm fade-up stagger-5">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <span className="pulse-dot" />
            <p style={{ fontWeight:600, color:'var(--text-base)', fontSize:14 }}>{t('expiringIn7Days')}</p>
          </div>
          {(Array.isArray(expiring) ? expiring.length : 0) === 0 ? (
            <p style={{ fontSize:14, color:'var(--text-muted)', textAlign:'center', padding:'32px 0' }}>{t('allGood')}</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:200, overflowY:'auto' }}>
              {expiring.map(c => {
                const days = Math.ceil((new Date(c.validTill)-new Date())/86400000)
                return (
                  <div key={c._id} className="bg-[var(--surface2)] border border-[var(--border-color)] rounded-lg" style={{ padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white" style={{ fontSize:13 }}>{c.name}</p>
                      <p className="text-slate-600 dark:text-slate-400 font-medium" style={{ fontSize:11, fontFamily:'JetBrains Mono,monospace' }}>{c.cafNumber}</p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ fontSize:13, fontWeight:700, color:'#F59E0B', fontFamily:'JetBrains Mono,monospace' }}>{days}d</p>
                      <p className="text-slate-600 dark:text-slate-400 font-medium" style={{ fontSize:10 }}>left</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-sm fade-up stagger-6 flex flex-col justify-center">
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-muted)', marginBottom:10 }}>
            <span>{t('collectionProgress')}</span>
            <span style={{ fontWeight:600, color:'#22C55E' }}>{paidPct}% {t('collected')}</span>
          </div>
          <div style={{ height:10, background:'#e2e8f0', borderRadius:99, overflow:'hidden', display:'flex' }}>
            <div className="progress-anim" style={{ width:`${(paid/total)*100}%`, background:'#22C55E', borderRadius:'99px 0 0 99px' }}/>
            <div className="progress-anim" style={{ width:`${(partial/total)*100}%`, background:'#F59E0B' }}/>
          </div>
          <div style={{ display:'flex', gap:16, marginTop:10 }}>
            {[
              { color:'#22C55E', label:`${t('paid')} (${paid})` },
              { color:'#F59E0B', label:`${t('partial')} (${partial})` },
              { color:'#334155', label:`${t('unpaid')} (${unpaid})` },
            ].map((s,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-muted)' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:s.color, display:'inline-block' }}/>
                {s.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>

      {/* PON Dashboard */}
      <div className="mt-4 fade-up stagger-8">
        <ErrorBoundary>
          <PonDashboard />
        </ErrorBoundary>
      </div>
    </div>
  )
}

const IcoUsers = ({color}) => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
const IcoAlert = ({color}) => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
const IcoCoins = ({color}) => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.8"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1110.34 18"/><path d="M7 6h1v4"/><path d="M16.71 13.88l.7.71-4.95 4.95"/></svg>
const IcoChart = ({color}) => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>

function SkeletonDash() {
  return (
    <div className="page space-y-5">
      <div className="skeleton h-8 w-48"/>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_,i)=><div key={i} className="skeleton h-28 rounded-2xl"/>)}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_,i)=><div key={i} className="skeleton h-24 rounded-2xl"/>)}
      </div>
      <div className="skeleton h-64 rounded-2xl"/>
    </div>
  )
}
