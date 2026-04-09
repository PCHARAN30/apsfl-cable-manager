import { useState, useEffect } from 'react'
import { getPaymentHistory, deletePayment } from '../services/api'
import { useLang } from '../context/LanguageContext'
import toast from 'react-hot-toast'

export default function PaymentHistoryModal({ isOpen, onClose, customer }) {
  const { t } = useLang()
  const [loading, setLoading] = useState(true)
  const [groupedHistory, setGroupedHistory] = useState([])
  const [availableYears, setAvailableYears] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isOpen && customer?._id) {
      fetchHistory()
    } else if (!isOpen) { setSearchQuery('') } // Reset search on close
  }, [isOpen, customer])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await getPaymentHistory(customer._id)
      const payments = res.data.data || [];
      
      // Determine join date & boundaries FIRST to start FIFO filling
      let joinDate = customer.connectionDate ? new Date(customer.connectionDate) : (customer.createdAt ? new Date(customer.createdAt) : new Date());
      if (payments.length > 0) {
        const earliestPayment = new Date(Math.min(...payments.map(p => new Date(p.paymentDate || p.createdAt))));
        if (earliestPayment < joinDate) joinDate = earliestPayment;
      }
      
      const joinYear = joinDate.getFullYear();
      const joinMonth = joinDate.getMonth();

      const paymentsByMonth = {};
      let maxAllocatedYear = joinYear;
      const planAmount = Math.max(Number(customer.planAmount) || 300, 1);
      
      let cursorY = joinYear;
      let cursorM = joinMonth;
      
      const sortedPayments = [...(payments || [])].sort((a, b) => 
        new Date(a.paymentDate || a.createdAt) - new Date(b.paymentDate || b.createdAt)
      );

      sortedPayments.forEach(p => {
        let remainingAmount = p.amountPaid;

        // FIFO Distribution across buckets
        while (remainingAmount > 0) {
          let key = `${cursorY}-${cursorM}`;
          
          if (!paymentsByMonth[key]) {
            paymentsByMonth[key] = { amount: 0, methods: [], dates: [], rawPayment: p };
          }
          
          let monthDebt = planAmount - paymentsByMonth[key].amount;
          if (monthDebt <= 0) {
            cursorM++;
            if (cursorM > 11) { cursorM = 0; cursorY++; }
            continue;
          }
          
          let applied = Math.min(remainingAmount, monthDebt);
          paymentsByMonth[key].amount += applied;
          
          let method = p.notes || 'Cash';
          if (!paymentsByMonth[key].methods.includes(method)) paymentsByMonth[key].methods.push(method);
          paymentsByMonth[key].dates.push(p.paymentDate || p.createdAt);
          paymentsByMonth[key].rawPayment = p;
          
          remainingAmount -= applied;
          if (cursorY > maxAllocatedYear) maxAllocatedYear = cursorY;

          if (remainingAmount > 0) {
            cursorM++;
            if (cursorM > 11) { cursorM = 0; cursorY++; }
          }
        }
      });

      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

      const currentYear = new Date().getFullYear();
      const startYear = joinYear;
      const endYear = Math.max(currentYear, maxAllocatedYear);

      const formatted = [];

      // Generate matrix from current year backwards to join year
      for (let y = endYear; y >= startYear; y--) {
        const yearMonths = months.map((month, index) => {
          const key = `${y}-${index}`;
          const payment = paymentsByMonth[key];
          const today = new Date();
          const isFutureMonth = y > today.getFullYear() || (y === today.getFullYear() && index > today.getMonth());

          if (y === joinYear && index < joinMonth) return { month, status: "not_applicable" };

          if (payment && payment.amount > 0) {
            let status = payment.amount >= planAmount ? "paid" : "partial";
            return { 
               month, 
               status,
               amount: payment.amount,
               date: payment.dates[payment.dates.length - 1],
               method: payment.methods.join(', '),
               rawPayment: payment.rawPayment
            };
          }

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

  const handleDeletePayment = async (payment) => {
    if (!window.confirm(`Delete payment of ₹${payment.amountPaid} made on ${new Date(payment.paymentDate).toLocaleDateString()}?\n\nThis action cannot be undone and will recalculate the customer's entire history.`)) {
        return;
    }
    try {
        await deletePayment(payment._id);
        toast.success('Payment deleted successfully.');
        await fetchHistory(); // Refresh the history
    } catch (error) {
        console.error("Delete payment error:", error);
        toast.error(error.response?.data?.message || 'Failed to delete payment.');
    }
  }

  if (!isOpen || !customer) return null

  // Filter logic for the global search bar
  const isSearching = searchQuery.trim().length > 0;
  const query = searchQuery.toLowerCase();

  const displayedHistory = groupedHistory.map(yearGroup => {
    const filteredMonths = yearGroup.months.filter(m => {
      if (!isSearching) return true;
      return (
        m.month.toLowerCase().includes(query) ||
        m.status.toLowerCase().includes(query) ||
        (m.amount && String(m.amount).includes(query)) ||
        (m.method && m.method.toLowerCase().includes(query))
      );
    });
    return { ...yearGroup, months: filteredMonths };
  }).filter(yearGroup => isSearching ? yearGroup.months.length > 0 : yearGroup.year === selectedYear);

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

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--surface2)]">
          <input 
            type="text" 
            placeholder="Search by amount (e.g., 300), month, or method (e.g., UPI)..." 
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-base)] text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Year Filter Tabs */}
        {!loading && availableYears.length > 1 && !isSearching && (
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
          ) : displayedHistory.length === 0 ? (
            <div className="text-center py-10 text-slate-500 bg-[var(--surface2)] rounded-xl border border-[var(--border-color)]">
              No matching records found for "{searchQuery}"
            </div>
          ) : (
            displayedHistory.map((yearGroup) => (
              <div key={yearGroup.year} className="bg-[var(--surface2)] rounded-xl border border-[var(--border-color)] overflow-hidden">
                {(availableYears.length === 1 || isSearching) && (
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
                        <div key={i} className="group flex items-center gap-4 py-2 px-3 rounded-lg bg-emerald-500/10 transition-all hover:bg-emerald-500/15">
                          <div className="w-10 text-sm font-bold text-slate-400 uppercase tracking-wider">{m.month}</div>
                          <div className="flex-1 text-sm">
                            <span className="font-semibold text-emerald-400">✅ Paid</span>
                            <span className="ml-2 text-slate-500 text-xs">
                              (Ref: ₹{m.amount} on {new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
                            </span>
                          </div>
                          <button onClick={() => handleDeletePayment(m.rawPayment)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400 p-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                    )
                  }
                  if (m.status === 'partial') {
                    return (
                      <div key={i} className="group flex items-center gap-4 py-2 px-3 rounded-lg bg-amber-500/10 transition-all hover:bg-amber-500/15">
                        <div className="w-10 text-sm font-bold text-slate-400 uppercase tracking-wider">{m.month}</div>
                        <div className="flex-1 text-sm">
                          <span className="font-semibold text-amber-400">🟠 Partial</span>
                          <span className="ml-2 text-slate-500 text-xs">
                            (Ref: ₹{m.amount} on {new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
                          </span>
                        </div>
                        <button onClick={() => handleDeletePayment(m.rawPayment)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400 p-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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