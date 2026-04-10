import { useState } from 'react'
import toast from 'react-hot-toast'
import { markPayment } from '../services/api'
import { useLang } from '../context/LanguageContext'

export default function PaymentModal({ customer, onClose, onSuccess }) {
  const { t } = useLang()
  const [amount, setAmount] = useState(customer.planAmount || 300)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return }
    setLoading(true)
    try {
      await markPayment(customer._id, { amountPaid:Number(amount), paymentMethod })
      toast.success('✅ Payment recorded successfully')
      onSuccess(); onClose()
    } catch (err) { toast.error(err.response?.data?.message || 'Payment failed') }
    finally { setLoading(false) }
  }

  const S = { // inline styles helper
    label: { fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:8, display:'block' },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}/>
      <div className="relative w-full max-w-[440px] p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl shadow-black/60 scale-in">
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <h2 style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:18, color:'var(--text-base)' }}>{customer.name}</h2>
            <p style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'JetBrains Mono,monospace', marginTop:2 }}>{customer.cafNumber}</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Billing Summary */}
        <div style={{ marginBottom:20, padding:'14px', borderRadius:12, background:'var(--surface2)', border:'1px solid var(--border-color)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
            <span style={{ color:'var(--text-muted)' }}>Monthly Plan:</span>
            <span style={{ fontWeight:600, color:'var(--text-base)', fontFamily:'JetBrains Mono,monospace' }}>₹{customer.planAmount || 300}</span>
          </div>
          {customer.carryOver > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
              <span style={{ color:'var(--text-muted)' }}>Pending Debt:</span>
              <span style={{ fontWeight:600, color:'#f59e0b', fontFamily:'JetBrains Mono,monospace' }}>₹{customer.carryOver}</span>
            </div>
          )}
          {customer.validTill && new Date(customer.validTill) < new Date() && (
             <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                <span style={{ color:'var(--text-muted)' }}>Account Status:</span>
                <span style={{ fontWeight:600, color:'#ef4444' }}>EXPIRED</span>
             </div>
          )}
        </div>

        {/* Amount */}
        <div style={{ marginBottom:16 }}>
          <span style={S.label}>{t('amountPaid')} (₹)</span>
          <input type="number" className="input" style={{ fontFamily:'JetBrains Mono,monospace', fontSize:24, padding:'14px 16px', fontWeight:700 }}
            value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" min="1"/>
        </div>

        {/* Payment Method */}
        <div style={{ marginBottom:20 }}>
          <span style={S.label}>{t('paymentMethod') || 'Payment Method'}</span>
          <select className="input" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)} style={{ appearance: 'auto', cursor: 'pointer' }}>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
          </select>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex:1 }}>{t('cancel')}</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ flex:1 }}>
            {loading ? '...' : t('confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
