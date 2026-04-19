export default function ViewCustomerModal({ customer, onClose }) {
  if (!customer) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[6px] transition-opacity" onClick={onClose}/>
      <div className="relative w-full max-w-[440px] p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex flex-col max-h-[80vh] shadow-2xl shadow-black/60 scale-in overflow-hidden">
        <div className="flex justify-between items-center mb-5 shrink-0">
          <h2 style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:18, color:'var(--text-base)' }}>Customer Details</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="space-y-4 text-sm overflow-y-auto custom-scrollbar flex-1 pr-2">
          <div><span className="text-slate-600 dark:text-slate-400 font-bold block text-[11px] uppercase tracking-widest mb-1">Name</span><div className="font-extrabold text-[var(--text-base)] text-lg">{customer.name}</div></div>
          <div><span className="text-slate-600 dark:text-slate-400 font-bold block text-[11px] uppercase tracking-widest mb-1">CAF Number</span><div className="font-mono font-bold text-[var(--text-base)] text-base">{customer.cafNumber}</div></div>
          <div><span className="text-slate-600 dark:text-slate-400 font-bold block text-[11px] uppercase tracking-widest mb-1">Phone</span><div className="font-bold text-[var(--text-base)] text-base">{customer.phone || 'NA'}</div></div>
          <div><span className="text-slate-600 dark:text-slate-400 font-bold block text-[11px] uppercase tracking-widest mb-1">Address</span><div className="font-semibold text-[var(--text-base)]">{customer.address || 'NA'}</div></div>
          <div><span className="text-slate-600 dark:text-slate-400 font-bold block text-[11px] uppercase tracking-widest mb-1">Package</span><div className="font-mono font-semibold text-[var(--text-base)]">{customer.planName || 'HomeBasic'} (₹{customer.planAmount || 291})</div></div>
          <div><span className="text-slate-600 dark:text-slate-400 font-bold block text-[11px] uppercase tracking-widest mb-1">PON Number</span><div className="font-mono font-semibold text-[var(--text-base)]">{customer.ponNumber || 'NA'}</div></div>
          <div><span className="text-slate-600 dark:text-slate-400 font-bold block text-[11px] uppercase tracking-widest mb-1">Connection Date</span><div className="font-semibold text-[var(--text-base)]">{customer.connectionDate ? new Date(customer.connectionDate).toLocaleDateString('en-IN') : 'NA/Unknown'}</div></div>
          <div><span className="text-slate-600 dark:text-slate-400 font-bold block text-[11px] uppercase tracking-widest mb-1">Notes</span><div className="text-slate-900 dark:text-white font-medium whitespace-pre-wrap">
            {customer.notes ? customer.notes.split('\n').map((line, i) => (
              line.trim().startsWith('[System:') 
                ? <span key={i} className="block text-indigo-400 text-xs italic mt-0.5">{line}</span>
                : <span key={i} className="block">{line}</span>
            )) : 'NA'}
          </div></div>
        </div>
        <div className="mt-6 pt-5 border-t border-[var(--border-color)] shrink-0">
          <button onClick={onClose} className="btn-secondary w-full">Close</button>
        </div>
      </div>
    </div>
  );
}