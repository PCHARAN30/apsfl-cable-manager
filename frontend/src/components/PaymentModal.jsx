import { useState } from 'react'
import toast from 'react-hot-toast'
import { markPayment } from '../services/api'
import { useLang } from '../context/LanguageContext'
import { playSuccessSound, playErrorSound } from '../utils/audio'

export default function PaymentModal({ customer, onClose, onSuccess }) {
  const { t } = useLang()
  const [amount, setAmount] = useState(customer.planAmount || 291)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState(null)

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) { playErrorSound(); toast.error('Enter a valid amount'); return }
    setLoading(true)
    try {
      const res = await markPayment(customer._id, { amountPaid:Number(amount), paymentMethod })
      playSuccessSound()
      toast.success('✅ Payment recorded successfully')
      setReceipt({
        customerName: customer.name,
        cafNumber: customer.cafNumber,
        amount: amount,
        paymentMethod,
        date: new Date().toLocaleString('en-IN'),
        validTill: res.data.payment.validTill ? new Date(res.data.payment.validTill).toLocaleDateString('en-IN') : 'NA',
      })
      if (onSuccess) onSuccess();
    } catch (err) { playErrorSound(); toast.error(err.response?.data?.message || 'Payment failed') }
    finally { setLoading(false) }
  }

  const S = { // inline styles helper
    label: { fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:8, display:'block' },
  }

  const getNextCycle = () => {
    let nextStart = new Date();
    if (customer.validTill) {
      const vt = new Date(customer.validTill);
      if (vt >= new Date(new Date().setHours(0,0,0,0))) {
        nextStart = new Date(vt);
        nextStart.setDate(nextStart.getDate() + 1);
      }
    }
    const nextEnd = new Date(nextStart);
    const currentDay = nextEnd.getDate();
    nextEnd.setMonth(nextEnd.getMonth() + 1);
    if (nextEnd.getDate() !== currentDay) nextEnd.setDate(0);
    nextEnd.setDate(nextEnd.getDate() - 1);
    return `${nextStart.toLocaleDateString('en-IN', {day:'2-digit', month:'short'})} → ${nextEnd.toLocaleDateString('en-IN', {day:'2-digit', month:'short'})}`;
  }

  if (receipt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}/>
        <div className="relative w-full max-w-sm p-6 rounded-3xl bg-[var(--bg-surface)] text-[var(--text-base)] border border-[var(--border-color)] shadow-2xl scale-in overflow-hidden">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h2 className="text-2xl font-bold mb-1">Payment Successful</h2>
            <p className="text-[var(--text-muted)] text-sm mb-6">{receipt.date}</p>
            
            <div className="bg-[var(--surface2)] rounded-2xl p-5 text-left space-y-3 mb-8 border border-[var(--border-color)]">
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Customer</span><span className="font-bold text-[var(--text-base)]">{receipt.customerName}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">CAF</span><span className="font-mono font-bold text-[var(--text-base)]">{receipt.cafNumber}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Amount</span><span className="font-bold text-emerald-500">₹{receipt.amount}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Valid Till</span><span className="font-bold text-[var(--text-base)]">{receipt.validTill}</span></div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button onClick={onClose} className="btn-secondary w-full py-3.5 rounded-xl text-base">Close</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}/>
      <div className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl shadow-black/60 scale-in overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-start bg-[var(--glass-bg)] shrink-0">
          <div>
            <h2 style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:18, color:'var(--text-base)' }}>{customer.name}</h2>
            <p style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'JetBrains Mono,monospace', marginTop:2 }}>{customer.cafNumber}</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[var(--bg-surface)]">
          
        {/* Billing Summary */}
        <div className="mb-5 p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border-color)]">
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
            <span style={{ color:'var(--text-muted)' }}>{customer.planName || 'Package'}:</span>
            <span style={{ fontWeight:600, color:'var(--text-base)', fontFamily:'JetBrains Mono,monospace' }}>₹{customer.planAmount || 291}</span>
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
          {customer.status !== 'UNPAID' && (
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-color)' }}>
              <span style={{ color:'var(--text-muted)' }}>Next Billing:</span>
              <span style={{ fontWeight:600, color:'var(--text-base)', fontFamily:'JetBrains Mono,monospace' }}>{getNextCycle()}</span>
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
        </div>

        {/* Sticky Footer */}
        <div className="p-5 border-t border-[var(--border-color)] bg-[var(--glass-bg)] flex gap-3 shrink-0">
          <button onClick={onClose} className="btn-secondary" style={{ flex:1 }}>{t('cancel')}</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ flex:1 }}>
            {loading ? '...' : t('confirm')}
          </button>
        </div>

      </div>
    </div>
  )
}
