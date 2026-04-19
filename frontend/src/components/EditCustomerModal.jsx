import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { updateCustomer, getSettings } from '../services/api'
import { useLang } from '../context/LanguageContext'

export default function EditCustomerModal({ customer, onClose, onSuccess, ponStats }) {
  const { t } = useLang()
  
  // Separate user notes from system logs
  const allNotes = customer.notes || '';
  const noteLines = allNotes.split('\n');
  const initialUserNotes = noteLines.filter(l => !l.trim().startsWith('[System:')).join('\n');
  const systemLogs = noteLines.filter(l => l.trim().startsWith('[System:'));

  // Initialize form with customer's existing data
  const [form, setForm] = useState({ 
    name: customer.name || '', 
    phone: customer.phone || '', 
    address: customer.address || '', 
    area: customer.area || '', 
    planName: customer.planName || 'HomeBasic',
    notes: initialUserNotes, 
    connectionDate: customer.connectionDate ? customer.connectionDate.split('T')[0] : '',
    billingStartDate: customer.billingStartDate ? customer.billingStartDate.split('T')[0] : '',
    ponNumber: customer.ponNumber || '',
    cafNumber: customer.cafNumber || ''
  })
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(() => {
    getSettings().then(res => {
      if (res.data?.data?.plans?.length > 0) {
        const loadedPlans = res.data.data.plans;
        setPlans(loadedPlans);
        if (!loadedPlans.some(p => p.name === customer.planName)) {
          const defaultPlan = loadedPlans.find(p => p.isDefault) || loadedPlans[0];
          setForm(f => ({ ...f, planName: defaultPlan.name }));
        }
      }
    }).catch(() => {});
  }, []);

  const allPackages = plans.map(p => ({ name: p.name, price: p.amount }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    if (!form.cafNumber?.trim()) { toast.error('CAF Number is required'); return }
    if (form.ponNumber && !/^[a-zA-Z0-9-]+$/.test(form.ponNumber)) {
      toast.error('PON Number must be alphanumeric (e.g., PON2, 2)');
      return;
    }
    setLoading(true)

    // Re-attach system logs to the payload without allowing them to be edited
    const payload = { ...form };
    if (systemLogs.length > 0) {
      const trimmedNotes = payload.notes.trim();
      payload.notes = trimmedNotes ? `${trimmedNotes}\n${systemLogs.join('\n')}` : systemLogs.join('\n');
    }

    try { 
      await updateCustomer(customer._id, payload); 
      toast.success('Customer updated!'); 
      onSuccess(); 
      onClose() 
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to update') 
    } finally { 
      setLoading(false) 
    }
  }

  const lbl = { fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:6, display:'block' }

  const isPonFull = ponStats && 
    form.ponNumber && 
    form.ponNumber !== customer.ponNumber && // Only check if it's a *new* PON
    (ponStats.get(form.ponNumber) || 0) >= 128;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[6px] transition-opacity" onClick={onClose}/>
      <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl shadow-black/60 scale-in overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--glass-bg)] shrink-0">
          <h2 style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:18, color:'var(--text-base)' }}>{t('editCustomer')}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[var(--bg-surface)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label:t('customerName'), key:'name', placeholder:'Full name', type:'text' }, // t('customerName') is 'Customer Name *'
            { 
              label:t('ponNumber'), 
              key:'ponNumber', 
              placeholder:'e.g. PON-1', 
              type:'text', 
              mono:true,
              warning: isPonFull 
                ? `PON Full (${ponStats.get(form.ponNumber)}/128)` 
                : null
            },
            { label:t('cafNumberLabel'), key:'cafNumber', placeholder:'e.g. CAF100123', type:'text', mono:true },
            { label:t('phoneNumber'), key:'phone', placeholder:'10-digit number', type:'text' }, // t('phoneNumber') is 'Phone Number'
            { label:t('connectionDate'), key:'connectionDate', placeholder:'', type:'date' },
            { label:t('monthlyPlan'), key:'planName', type:'planSelect' }, // t('monthlyPlan') is 'Monthly Plan Amount (₹)'
            { label:t('address'), key:'address', placeholder:'Full address', type:'text' },
            { label:t('area'), key:'area', placeholder:'e.g. North Zone', type:'text' },
          ].map(f => (
            <div key={f.key} className={f.fullWidth ? "md:col-span-2" : ""}>
              <span style={lbl}>{f.label}</span>
              {f.type === 'planSelect' ? (
                <select className="input w-full" style={{fontFamily:'JetBrains Mono,monospace'}} value={form.planName} onChange={e => set('planName', e.target.value)}>
                  {allPackages.length === 0 && <option value="" disabled>No packages configured</option>}
                  {allPackages.map(pkg => (
                    <option key={pkg.name} value={pkg.name}>{pkg.name} - ₹{pkg.price}</option>
                  ))}
                </select>
              ) : (
                <input type={f.type} className="input" style={f.mono?{fontFamily:'JetBrains Mono,monospace'}:{}}
                  value={form[f.key]} onChange={e=>set(f.key, e.target.value)} placeholder={f.placeholder}/>
              )}
              {f.warning && (
                <p className="text-xs text-amber-500 mt-1.5 font-medium">{f.warning}</p>
              )}
            </div>
          ))}

          {/* Billing Reset Section */}
          {form.billingStartDate && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 md:col-span-2">
              <div className="flex justify-between items-center">
                <div>
                  <span style={lbl} className="!mb-1 text-amber-300">Billing Reset Active</span>
                  <p className="text-sm text-amber-400 font-medium">
                    First bill from: {new Date(form.billingStartDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to remove the billing reset? This will make all past dues visible again.')) {
                      set('billingStartDate', ''); // Set to empty string, backend will handle null
                    }
                  }}
                  className="btn-secondary bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/20 text-xs px-3 py-1.5"
                >
                  Clear Reset
                </button>
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div className="md:col-span-2">
            <span style={lbl}>{t('notesLabel')}</span>
            <textarea
              className="input w-full"
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Optional operator notes..."
            />
            {systemLogs.length > 0 && (
              <div className="mt-2 bg-[var(--surface2)] p-3 rounded-lg border border-[var(--border-color)]">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">System Logs</span>
                {systemLogs.map((log, i) => (
                  <span key={i} className="block text-indigo-400 text-xs italic mt-0.5">{log}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-5 border-t border-[var(--border-color)] bg-[var(--glass-bg)] flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="btn-secondary" style={{ flex:1 }}>{t('cancel')}</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ flex:1 }}>
            {loading ? t('updating') : t('saveChanges')}
          </button>
        </div>
      </div>
    </div>
  )
}