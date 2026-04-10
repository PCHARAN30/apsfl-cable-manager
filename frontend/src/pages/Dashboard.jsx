import { useEffect, useState } from 'react'
import { getDashboardStats, getExpiringCustomers, getMonthlyChart, resetDashboard } from '../services/api'
import { useLang } from '../context/LanguageContext'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PonDashboard from '../components/PonDashboard'

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) : '—'

const fmt = (n) => `₹${Number(n||0).toLocaleString('en-IN')}`

export default function Dashboard() {
  const { t } = useLang()
  const [stats, setStats]       = useState(null)
  const [expiring, setExpiring] = useState([])
  const [chart, setChart]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [resetting, setResetting] = useState(false)

  const load = async () => {
    try {
      const [s, e, c] = await Promise.all([
        getDashboardStats(), getExpiringCustomers(7), getMonthlyChart(),
      ])
      setStats(s.data.data)
      setExpiring(e.data.data)
      setChart(c.data.data.map(d => ({ date: d._id.slice(5), income: d.income, count: d.count })))
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
    { label: t('totalCustomers'), value: total,                     color: '#3b82f6', icon: IcoUsers,  sub: `${paidPct}${t('paidThisMonth')}` },
    { label: t('toReceive'),      value: fmt(stats?.totalToReceive), color: '#ef4444', icon: IcoAlert, sub: `${unpaid} unpaid + ${partial} partial`, tooltip: toReceiveTooltip },
    { label: t('todaysIncome'),   value: fmt(stats?.dailyIncome),    color: '#15b070', icon: IcoCoins, sub: new Date().toLocaleDateString('en-IN') },
    { label: t('monthlyIncome'),  value: fmt(stats?.monthlyIncome),  color: '#a855f7', icon: IcoChart, sub: new Date().toLocaleString('en-IN',{month:'long'}) },
  ]
  const bottomCards = [
    { label: t('paid'),    value: paid,    color: '#15b070', sub: t('activeSubscriptions') },
    { label: t('unpaid'),  value: unpaid,  color: '#ef4444', sub: t('needToCollect') },
    { label: t('partial'), value: partial, color: '#f59e0b', sub: t('balancePending') },
  ]

  return (
    <div className="page">
      {/* Header */}
      <div className="fade-up flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:26, color:'var(--text-base)' }}>{t('dashboard')}</h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {topCards.map((c, i) => (
          <div key={i} className={`p-5 rounded-2xl glass-panel fade-up stagger-${i+1}`} title={c.tooltip}>
            <div className="flex items-start justify-between mb-3">
              <p style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)' }}>{c.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:`${c.color}18` }}>
                <c.icon color={c.color} />
              </div>
            </div>
            <p className="count-up" style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:22, color:c.color }}>{c.value}</p>
            <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Bottom stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        {bottomCards.map((c, i) => (
          <div key={i} className={`p-5 rounded-2xl glass-panel fade-up stagger-${i+5}`}>
            <p style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:8 }}>{c.label}</p>
            <p style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:28, color:c.color }}>{c.value}</p>
            <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart + expiring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Income chart */}
        <div className="p-6 rounded-2xl glass-panel lg:col-span-2 fade-up stagger-5">
          <p style={{ fontWeight:600, color:'var(--text-base)', marginBottom:16, fontSize:15 }}>{t('incomeThisMonth')}</p>
          {chart.length === 0 ? (
            <div style={{ height:180, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-dim)', fontSize:14 }}>
              {t('noPayments')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chart} margin={{ top:4, right:4, left:0, bottom:0 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#15b070" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#15b070" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)"/>
                <XAxis dataKey="date" tick={{ fill:'var(--chart-text)', fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'var(--chart-text)', fontSize:11 }} axisLine={false} tickLine={false}
                  tickFormatter={v=>`₹${v>=1000?(v/1000).toFixed(0)+'k':v}`}/>
                <Tooltip contentStyle={{ background:'var(--bg-surface)', border:'1px solid var(--border-color)', borderRadius:12, fontSize:12, color:'var(--text-base)' }}
                  labelStyle={{ color:'var(--text-muted)' }} formatter={v=>[`₹${v.toLocaleString('en-IN')}`,'Income']}/>
                <Area type="monotone" dataKey="income" stroke="#15b070" strokeWidth={2.5}
                  fill="url(#g)" dot={false} activeDot={{ r:5, fill:'#15b070', stroke:'#080e1a', strokeWidth:2 }}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expiring soon */}
        <div className="p-6 rounded-2xl glass-panel fade-up stagger-6">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <span className="pulse-dot" />
            <p style={{ fontWeight:600, color:'var(--text-base)', fontSize:14 }}>{t('expiringIn7Days')}</p>
          </div>
          {expiring.length === 0 ? (
            <p style={{ fontSize:14, color:'var(--text-dim)', textAlign:'center', padding:'32px 0' }}>{t('allGood')}</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:200, overflowY:'auto' }}>
              {expiring.map(c => {
                const days = Math.ceil((new Date(c.validTill)-new Date())/86400000)
                return (
                  <div key={c._id} className="card-inner" style={{ padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <p style={{ fontSize:13, fontWeight:500, color:'var(--text-base)' }}>{c.name}</p>
                      <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono,monospace' }}>{c.cafNumber}</p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ fontSize:13, fontWeight:700, color:'#fbbf24', fontFamily:'JetBrains Mono,monospace' }}>{days}d</p>
                      <p style={{ fontSize:10, color:'var(--text-muted)' }}>left</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="p-6 mt-4 rounded-2xl glass-panel fade-up stagger-7">
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-muted)', marginBottom:10 }}>
            <span>{t('collectionProgress')}</span>
            <span style={{ fontWeight:600, color:'#34d399' }}>{paidPct}% {t('collected')}</span>
          </div>
          <div style={{ height:10, background:'var(--surface2)', borderRadius:99, overflow:'hidden', display:'flex' }}>
            <div className="progress-anim" style={{ width:`${(paid/total)*100}%`, background:'#15b070', borderRadius:'99px 0 0 99px' }}/>
            <div className="progress-anim" style={{ width:`${(partial/total)*100}%`, background:'#f59e0b' }}/>
          </div>
          <div style={{ display:'flex', gap:16, marginTop:10 }}>
            {[
              { color:'#15b070', label:`${t('paid')} (${paid})` },
              { color:'#f59e0b', label:`${t('partial')} (${partial})` },
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

      {/* PON Dashboard */}
      <div className="mt-4 fade-up stagger-8">
        <PonDashboard />
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
