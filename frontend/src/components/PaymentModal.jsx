import { useState } from 'react'
import toast from 'react-hot-toast'
import { markPayment } from '../services/api'
import { useLang } from '../context/LanguageContext'

export default function PaymentModal({ customer, onClose, onSuccess }) {
  const { t } = useLang()
  const [type, setType]     = useState('FULL')
  const [amount, setAmount] = useState(customer.planAmount || 300)
  const [months, setMonths] = useState(1)
  const [notes, setNotes]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return }
    setLoading(true)
    try {
      await markPayment(customer._id, { paymentType:type, amountPaid:Number(amount), planMonths:Number(months), notes })
      toast.success(type === 'FULL' ? '✅ Full payment recorded' : '🟠 Partial payment recorded')
      onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Payment failed') }
    finally { setLoading(false) }
  }

  const S = { // inline styles helper
    label: { fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:8, display:'block' },
    typeBtn: (active, color) => ({
      flex:1, padding:'10px 0', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer',
      border:`1px solid ${active ? color+'60' : 'var(--border)'}`,
      background: active ? color+'20' : 'var(--surface2)',
      color: active ? color : 'var(--text-muted)',
      transition:'all 0.15s'
    }),
    monthBtn: (active) => ({
      flex:1, padding:'8px 0', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer',
      fontFamily:'JetBrains Mono,monospace',
      border:`1px solid ${active ? '#15b070' + '60' : 'var(--border)'}`,
      background: active ? 'rgba(21,176,112,0.15)' : 'var(--surface2)',
      color: active ? '#34d399' : 'var(--text-muted)',
      transition:'all 0.15s'
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" onClick={onClose}/>
      <div className="relative w-full max-w-[440px] p-6 sm:p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl shadow-black/60 scale-in">
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <h2 style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:18, color:'white' }}>{customer.name}</h2>
            <p style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'JetBrains Mono,monospace', marginTop:2 }}>{customer.cafNumber}</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Carry-over */}
        {customer.carryOver > 0 && (
          <div style={{ marginBottom:16, padding:'10px 14px', borderRadius:10, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', fontSize:13, color:'#fbbf24' }}>
            ⚠️ {t('carryOver')}: <strong style={{ fontFamily:'JetBrains Mono,monospace' }}>₹{customer.carryOver}</strong>
          </div>
        )}

        {/* Type */}
        <div style={{ marginBottom:16 }}>
          <span style={S.label}>{t('paymentType')}</span>
          <div style={{ display:'flex', gap:8 }}>
            <button style={S.typeBtn(type==='FULL','#15b070')} onClick={()=>{ setType('FULL'); setAmount((customer.planAmount||300)*months) }}>
              ✅ {t('fullPaid')}
            </button>
            <button style={S.typeBtn(type==='PARTIAL','#f59e0b')} onClick={()=>{ setType('PARTIAL'); setAmount('') }}>
              🟠 {t('partial')}
            </button>
          </div>
        </div>

        {/* Months (FULL only) */}
        {type === 'FULL' && (
          <div style={{ marginBottom:16 }}>
            <span style={S.label}>{t('monthsPaid')}</span>
            <div style={{ display:'flex', gap:6 }}>
              {[1,2,3,6,12].map(m => (
                <button key={m} style={S.monthBtn(months===m)} onClick={()=>{ setMonths(m); setAmount((customer.planAmount||300)*m) }}>{m}</button>
              ))}
            </div>
          </div>
        )}

        {/* Amount */}
        <div style={{ marginBottom:16 }}>
          <span style={S.label}>{t('amountPaid')} (₹)
            {type==='FULL' && <span style={{ textTransform:'none', letterSpacing:'normal', marginLeft:8, color:'var(--text-dim)' }}>
              ₹{customer.planAmount||300} × {months} = ₹{(customer.planAmount||300)*months}
            </span>}
          </span>
          <input type="number" className="input" style={{ fontFamily:'JetBrains Mono,monospace', fontSize:18 }}
            value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Enter amount" min="1"/>
          {type==='PARTIAL' && amount && (
            <p style={{ fontSize:12, color:'#fbbf24', marginTop:6, fontFamily:'JetBrains Mono,monospace' }}>
              {t('carryOverNext')}: ₹{Math.max(0,(customer.planAmount||300)-Number(amount)+(customer.carryOver||0))}
            </p>
          )}
        </div>

        {/* Notes */}
        <div style={{ marginBottom:20 }}>
          <span style={S.label}>{t('notes')}</span>
          <input className="input" value={notes} onChange={e=>setNotes(e.target.value)} placeholder={t('notesPlaceholder')}/>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex:1 }}>{t('cancel')}</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ flex:1 }}>
            {loading ? '...' : `${t('confirm')} ${type==='FULL'?t('fullPaid'):t('partial')}`}
          </button>
        </div>
      </div>
    </div>
  )
}
