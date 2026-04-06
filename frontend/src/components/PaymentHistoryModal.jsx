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
      
      // Group by Year -> Month
      const grouped = payments.reduce((acc, payment) => {
        const date = new Date(payment.paymentDate || payment.createdAt)
        const year = date.getFullYear()
        const month = date.toLocaleString('default', { month: 'short' }) // e.g., 'Jan'

        if (!acc[year]) acc[year] = {}
        if (!acc[year][month]) acc[year][month] = []
        
        acc[year][month].push(payment)
        return acc
      }, {})

      // Convert to array and sort Years descending
      const formatted = Object.keys(grouped)
        .sort((a, b) => b - a)
        .map(year => ({
          year,
          months: Object.keys(grouped[year]).map(month => ({
            month,
            payments: grouped[year][month]
          }))
        }))

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
                <div className="p-4 space-y-4">
                  {yearGroup.months.map((monthGroup) => (
                    <div key={monthGroup.month} className="ml-2 border-l-2 border-emerald-500/30 pl-4 relative">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                      <h3 className="text-sm font-bold text-emerald-400 mb-2 uppercase tracking-wider">{monthGroup.month}</h3>
                      <div className="space-y-2">
                        {monthGroup.payments.map((p, i) => (
                          <div key={i} className="bg-[var(--bg-base)] rounded-lg p-3 flex justify-between items-center border border-[var(--border-color)] hover:opacity-80 transition-colors">
                            <span className="text-sm font-medium text-[var(--text-base)]">
                              {p.paymentType === 'FULL' ? '✔' : '⚠️'} {p.paymentType}
                            </span>
                            <span className="text-lg font-bold text-[var(--text-base)]">₹{p.amountPaid}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}