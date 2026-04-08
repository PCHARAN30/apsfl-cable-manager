import { useState, useEffect } from 'react'
import { getPaymentHistory } from '../services/api'
import { useLang } from '../context/LanguageContext'
import toast from 'react-hot-toast'

export default function PaymentHistoryModal({ isOpen, onClose, customer }) {
  const { t } = useLang()
  const [loading, setLoading] = useState(true)
  const [groupedHistory, setGroupedHistory] = useState([])

  useEffect(() => {
    if (isOpen && customer?._id) {
      fetchHistory()
    }
  }, [isOpen, customer])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await getPaymentHistory(customer._id)
      const payments = res.data.data || []
      
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

      // Determine join date & boundaries
      let joinDate = customer.createdAt ? new Date(customer.createdAt) : new Date();
      // Fallback in case a payment was recorded prior to the database 'createdAt' field
      if (payments.length > 0) {
        const earliestPayment = new Date(Math.min(...payments.map(p => new Date(p.paymentDate || p.createdAt))));
        if (earliestPayment < joinDate) joinDate = earliestPayment;
      }
      
      const joinYear = joinDate.getFullYear();
      const joinMonth = joinDate.getMonth();

      const currentYear = new Date().getFullYear();
      const startYear = joinYear;
      const paymentYears = payments.map(p => new Date(p.paymentDate || p.createdAt).getFullYear());
      const endYear = Math.max(currentYear, ...paymentYears.length ? paymentYears : [currentYear]);

      const formatted = [];

      // Generate matrix from current year backwards to join year
      for (let y = endYear; y >= startYear; y--) {
        const yearMonths = months.map((month, index) => {
          const payment = payments.find(p => {
            const d = new Date(p.paymentDate || p.createdAt);
            return d.getFullYear() === y && d.getMonth() === index;
          });

          if (y === joinYear && index < joinMonth) return { month, status: "not_applicable" };
          if (payment) return { month, status: "paid", amount: payment.amountPaid, date: payment.paymentDate || payment.createdAt, method: payment.notes || 'Cash' };
          return { month, status: "unpaid" };
        });
        formatted.push({ year: y, months: yearMonths });
      }

      setGroupedHistory(formatted)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !customer) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] w-full max-w-2xl rounded-2xl shadow-2xl shadow-black/50 flex flex-col max-h-[85vh] overflow-hidden fade-up">
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--glass-bg)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-base)] tracking-tight">
              {t('paymentHistoryFor')} <span className="text-emerald-400">{customer.name}</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1 font-mono">CAF: {customer.cafNumber}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-base)] bg-[var(--surface2)] hover:opacity-80 rounded-full p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {loading ? (
            <div className="text-center py-10 text-slate-400 animate-pulse">Loading history...</div>
          ) : groupedHistory.length === 0 ? (
            <div className="text-center py-10 text-slate-500 bg-[var(--surface2)] rounded-xl border border-[var(--border-color)]">
              {t('noHistoryFound')}
            </div>
          ) : (
            groupedHistory.map((yearGroup) => (
              <div key={yearGroup.year} className="bg-[var(--surface2)] rounded-xl border border-[var(--border-color)] overflow-hidden">
                <div className="bg-[var(--border-color)] px-5 py-3 border-b border-[var(--border-color)] font-bold text-[var(--text-base)] shadow-inner">
                  {yearGroup.year}
                </div>
                <div className="p-3 space-y-1.5">
                  {yearGroup.months.map((m, i) => {
                    if (m.status === 'not_applicable') {
                      return (
                        <div key={i} className="flex items-center gap-4 py-2 px-3 opacity-40">
                          <div className="w-10 text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">{m.month}</div>
                          <div className="flex-1 text-[var(--text-muted)] text-sm font-medium">— (Not applicable)</div>
                        </div>
                      )
                    }
                    if (m.status === 'paid') {
                      return (
                        <div key={i} className="flex items-center gap-4 py-2.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <div className="w-10 text-sm font-bold text-[var(--text-base)] uppercase tracking-wider">{m.month}</div>
                          <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                            <div className="text-emerald-500 font-bold text-sm flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                              Paid ₹{m.amount}
                            </div>
                            <div className="text-xs text-emerald-500/80 font-medium">
                              ({new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, {m.method})
                            </div>
                          </div>
                        </div>
                      )
                    }
                    if (m.status === 'unpaid') {
                      return (
                        <div key={i} className="flex items-center gap-4 py-2.5 px-3 rounded-lg bg-red-500/5 border border-red-500/10">
                          <div className="w-10 text-sm font-bold text-[var(--text-base)] uppercase tracking-wider">{m.month}</div>
                          <div className="flex-1 flex items-center justify-between">
                            <div className="text-red-400 font-bold text-sm flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                              Unpaid
                            </div>
                          </div>
                        </div>
                      )
                    }
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}