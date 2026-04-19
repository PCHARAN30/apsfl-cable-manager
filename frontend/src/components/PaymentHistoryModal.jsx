import { useState, useEffect } from 'react'
import { getPaymentHistory, deletePayment, getCustomerById } from '../services/api'
import { useLang } from '../context/LanguageContext'
import toast from 'react-hot-toast'

export default function PaymentHistoryModal({ isOpen, onClose, customer: initialCustomer }) {
  const { t } = useLang()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [fullCustomer, setFullCustomer] = useState(null)

  useEffect(() => {
    if (isOpen && initialCustomer?._id) {
      fetchHistory()
      getCustomerById(initialCustomer._id).then(res => setFullCustomer(res.data.data)).catch(()=>{})
    } else if (!isOpen) { 
      setSearchQuery('');
      setFullCustomer(null);
    }
  }, [isOpen, initialCustomer])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await getPaymentHistory(initialCustomer._id)
      setPayments(res.data.data || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePayment = async (payment) => {
    if (!window.confirm(`Delete 1 month of validity from this payment record?\n\nThis action will safely deduct exactly one month of validity.`)) {
        return;
    }
    try {
        await deletePayment(payment._id, { singleMonth: true });
        toast.success('1 Month removed from payment successfully.');
        await fetchHistory(); // Refresh the history
    } catch (error) {
        console.error("Delete payment error:", error);
        toast.error(error.response?.data?.message || 'Failed to delete payment.');
    }
  }

  if (!isOpen || !initialCustomer) return null
  const customer = fullCustomer || initialCustomer;

  // Filter logic for the global search bar
  const isSearching = searchQuery.trim().length > 0;
  const query = searchQuery.toLowerCase();

  const filteredPayments = payments.filter(p => {
    if (!isSearching) return true;
    return (
      String(p.amountPaid).includes(query) ||
      (p.notes && p.notes.toLowerCase().includes(query))
    );
  });

  const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'NA';

  // Calculate Next Pending Cycle logic exactly matching your rule
  let pendingStart = new Date();
  if (customer.validTill) {
      const vt = new Date(customer.validTill);
      if (vt >= new Date(new Date().setHours(0,0,0,0))) {
          pendingStart = new Date(vt);
          pendingStart.setDate(pendingStart.getDate() + 1);
      }
  } else if (customer.billingStartDate) {
      pendingStart = new Date(customer.billingStartDate);
  }

  const pendingEnd = new Date(pendingStart);
  const pDay = pendingEnd.getDate();
  pendingEnd.setMonth(pendingEnd.getMonth() + 1);
  if (pendingEnd.getDate() !== pDay) pendingEnd.setDate(0);
  pendingEnd.setDate(pendingEnd.getDate() - 1);

  const isPendingOverdue = pendingStart < new Date(new Date().setHours(0,0,0,0));

  const statusStyles = {
    PAID: 'border-emerald-500/20 hover:border-emerald-500/40',
    PARTIAL: 'border-amber-500/20 hover:border-amber-500/40',
    PENDING: 'bg-amber-500/10 border-amber-500/20',
    EXPIRED: 'bg-red-500/10 border-red-500/20',
  }

  // Group payments by Year -> Month
  const grouped = filteredPayments.reduce((acc, p) => {
    const d = new Date(p.validFrom || p.paymentDate || new Date());
    const year = d.getFullYear();
    const month = d.toLocaleString('en-IN', { month: 'long' });
    const mIdx = d.getMonth();
    
    if (!acc[year]) acc[year] = {};
    if (!acc[year][month]) acc[year][month] = { index: mIdx, payments: [] };
    
    acc[year][month].payments.push(p);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[6px] transition-opacity" onClick={onClose}/>
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] w-full max-w-2xl rounded-3xl shadow-2xl shadow-black/50 flex flex-col max-h-[80vh] overflow-hidden scale-in relative z-10">
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--glass-bg)]">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
              {t('paymentHistoryFor')} <span className="text-orange-500">{customer.name}</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1 font-mono">CAF: {customer.cafNumber}</p>
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
            placeholder="Search by amount (e.g., 300) or payment method..." 
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-base)] text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[var(--bg-surface)]">
          {loading ? (
            <div className="text-center py-10 text-slate-600 dark:text-slate-400 font-medium animate-pulse">Loading subscription history...</div>
          ) : (
            <div className="flex flex-col gap-6">
              
              {/* Timeline Reset Banner */}
              {customer.billingStartDate && !isSearching && payments.length === 0 && (
                 <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                   <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                   </div>
                   <div>
                      <div className="text-sm font-bold text-amber-400">Billing Timeline Reset</div>
                      <div className="text-xs text-amber-500/80 mt-0.5">All dues before {formatDate(customer.billingStartDate)} were cleared. First bill due from {formatDate(customer.billingStartDate)}.</div>
                   </div>
                 </div>
              )}

              {/* Pending Cycle */}
              {!isSearching && (
                <div className={`p-4 rounded-xl border ${isPendingOverdue ? statusStyles.EXPIRED : statusStyles.PENDING}`}>
                  <div className="flex justify-between items-start">
                    <div className="font-semibold text-[var(--text-base)] text-sm">
                      {formatDate(pendingStart)} → {formatDate(pendingEnd)}
                    </div>
                    <span className={`text-xs font-bold ${isPendingOverdue ? 'text-red-500' : 'text-amber-500'}`}>
                      {isPendingOverdue ? '❌ EXPIRED' : '⏳ PENDING'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-2">
                    ₹{customer.planAmount || 300} | Next Bill
                  </div>
                </div>
              )}

              {/* Payment Cycles grouped by Year/Month */}
              {Object.keys(grouped).sort((a,b)=>b-a).map(year => (
                <div key={year} className="flex flex-col gap-4">
                  <h3 className="text-lg font-extrabold text-[var(--text-base)] border-b border-[var(--border-color)] pb-2">{year}</h3>
                  
                  {Object.keys(grouped[year]).sort((a,b)=>grouped[year][b].index - grouped[year][a].index).map(month => (
                    <div key={month} className="relative">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">{month}</span>
                        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2 md:pl-4 border-l-2 border-slate-200 dark:border-slate-800">
                        {grouped[year][month].payments.map(p => {
                          const isPartial = p.paymentType === 'PARTIAL';
                          const vfStr = formatDate(p.validFrom || p.paymentDate);
                          const vtStr = formatDate(p.validTill);
                          const isDebtOnly = vfStr === vtStr;
                          
                          return (
                            <div key={p._id} className={`group p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50 relative transition-colors ${isPartial ? statusStyles.PARTIAL : statusStyles.PAID}`}>
                              <div className="flex justify-between items-start">
                                <div className="font-semibold text-sm text-[var(--text-base)]">
                                  {isDebtOnly ? 'Debt / Partial Payment' : `${vfStr} → ${vtStr}`}
                                </div>
                                <span className={`text-xs font-bold ${isPartial ? 'text-amber-500' : 'text-emerald-500'}`}>
                                  {isPartial ? '🟠 PARTIAL' : '✅ PAID'}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 font-medium mt-2">
                                <span className="font-mono font-semibold text-emerald-500">₹{p.amountPaid}</span> | Paid on <span className="font-semibold text-[var(--text-base)]">{formatDate(p.paymentDate)}</span>
                              </div>
                              <button onClick={() => handleDeletePayment(p)} className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10" title="Delete Payment">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {filteredPayments.length === 0 && isSearching && (
                <div className="text-center py-8 text-slate-500 font-medium">No matching payments found.</div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  )
}