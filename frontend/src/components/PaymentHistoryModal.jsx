import { useState, useEffect } from 'react'
import { getPaymentHistory } from '../services/api'
import { useLang } from '../context/LanguageContext'
import toast from 'react-hot-toast'

export default function PaymentHistoryModal({ isOpen, onClose, customer }) {
  const { t } = useLang()
  const [loading, setLoading] = useState(true)
  const [groupedHistory, setGroupedHistory] = useState([])
  const [availableYears, setAvailableYears] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (isOpen && customer?._id) {
      fetchHistory()
    }
  }, [isOpen, customer])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await getPaymentHistory(customer._id)
      const payments = res.data.data || [];
      
      // Group payments by month (YYYY-MM), ensuring only the latest payment per month is used.
      const paymentsByMonth = (payments || []).reduce((acc, p) => {
        const d = new Date(p.paymentDate || p.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!acc[key] || d > new Date(acc[key].paymentDate || acc[key].createdAt)) {
          acc[key] = p;
        }
        return acc;
      }, {});
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

      // Determine join date & boundaries
      let joinDate = customer.connectionDate ? new Date(customer.connectionDate) : (customer.createdAt ? new Date(customer.createdAt) : new Date());
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
          const key = `${y}-${index}`;
          const payment = paymentsByMonth[key];
          const today = new Date();
          const isFutureMonth = y > today.getFullYear() || (y === today.getFullYear() && index > today.getMonth());

          if (y === joinYear && index < joinMonth) return { month, status: "not_applicable" };
          if (payment) return { month, status: "paid", amount: payment.amountPaid, date: payment.paymentDate || payment.createdAt, method: payment.notes || 'Cash' };
          if (isFutureMonth) return { month, status: "future" }; // Don't mark future months as unpaid
          return { month, status: "unpaid" };
        });
        formatted.push({ year: y, months: yearMonths });
      }

      setGroupedHistory(formatted)
      const years = formatted.map(f => f.year)
      setAvailableYears(years)
      if (years.length > 0) setSelectedYear(years[0])
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

        {/* Year Filter Tabs */}
        {!loading && availableYears.length > 1 && (
          <div className="bg-[var(--glass-bg)] border-b border-[var(--border-color)] px-6 py-3 flex gap-2 overflow-x-auto">
            {availableYears.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${
                  selectedYear === year 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-base)] hover:bg-[var(--surface2)] border border-transparent'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {loading ? (
            <div className="text-center py-10 text-slate-400 animate-pulse">Loading history...</div>
          ) : groupedHistory.length === 0 ? (
            <div className="text-center py-10 text-slate-500 bg-[var(--surface2)] rounded-xl border border-[var(--border-color)]">
              {t('noHistoryFound')}
            </div>
          ) : (
            groupedHistory.filter(g => g.year === selectedYear).map((yearGroup) => (
              <div key={yearGroup.year} className="bg-[var(--surface2)] rounded-xl border border-[var(--border-color)] overflow-hidden">
                {availableYears.length === 1 && (
                  <div className="bg-[var(--border-color)] px-5 py-3 border-b border-[var(--border-color)] font-bold text-[var(--text-base)] shadow-inner">
                    {yearGroup.year}
                  </div>
                )}
                <div className="p-3 space-y-1.5">
                  {yearGroup.months.map((m, i) => {
                    if (m.status === 'not_applicable') {
                      return null; // Don't render months before joining
                    }
                    if (m.status === 'future') {
                      return ( // Render future months differently, less prominently
                        <div key={i} className="flex items-center gap-4 py-2 px-3">
                          <div className="w-10 text-sm font-bold text-slate-600 uppercase tracking-wider">{m.month}</div>
                          <div className="flex-1 text-slate-600 text-sm font-medium">—</div>
                        </div>
                      );
                    }
                    if (m.status === 'paid') {
                      return (
                        <div key={i} className="flex items-center gap-4 py-2 px-3 rounded-lg bg-emerald-500/10">
                          <div className="w-10 text-sm font-bold text-slate-400 uppercase tracking-wider">{m.month}</div>
                          <div className="flex-1 text-sm">
                            <span className="font-semibold text-emerald-400">✅ Paid ₹{m.amount}</span>
                            <span className="ml-2 text-slate-500 text-xs">
                              ({new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, {m.method})
                            </span>
                          </div>
                        </div>
                      )
                    }
                    if (m.status === 'unpaid') {
                      return (
                        <div key={i} className="flex items-center gap-4 py-2 px-3 rounded-lg">
                          <div className="w-10 text-sm font-bold text-slate-400 uppercase tracking-wider">{m.month}</div>
                          <div className="flex-1 text-sm font-semibold text-red-400">
                            ❌ Unpaid
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