import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { createCustomer, getSettings } from '../services/api'
import { useLang } from '../context/LanguageContext'

export default function AddCustomerModal({ onClose, onSuccess, ponStats }) {
  const { t } = useLang()
  const [form, setForm] = useState({ name:'', phone:'', address:'', area:'', cafNumber:'', planName:'HomeBasic', notes:'', connectionDate:'', ponNumber:'' })
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(() => {
    getSettings().then(res => {
      if (res.data?.data?.plans?.length > 0) {
        const loadedPlans = res.data.data.plans;
        setPlans(loadedPlans);
        const defaultPlan = loadedPlans.find(p => p.isDefault) || loadedPlans[0];
        setForm(f => ({ ...f, planName: defaultPlan.name }));
      }
    }).catch(() => {});
  }, []);

  const allPackages = plans.map(p => ({ name: p.name, price: p.amount }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.cafNumber.trim()) { toast.error('Name and CAF are required'); return }
    if (form.ponNumber && !/^[a-zA-Z0-9-]+$/.test(form.ponNumber)) {
      toast.error('PON Number must be alphanumeric (e.g., PON2, 2)');
      return;
    }
    setLoading(true)
    try { await createCustomer(form); toast.success('Customer added!'); onSuccess(); onClose() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setLoading(false) }
  }

  const lbl = { fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:6, display:'block' }

  const isPonFull = ponStats && form.ponNumber && (ponStats.get(form.ponNumber) || 0) >= 128;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[6px] transition-opacity" onClick={onClose}/>
      <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl shadow-black/60 scale-in overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--glass-bg)] shrink-0">
          <h2 style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:18, color:'var(--text-base)' }}>{t('addCustomer')}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[var(--bg-surface)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label:t('customerName'), key:'name', placeholder:'Full name', type:'text' },
            { label:t('cafNumberLabel'), key:'cafNumber', placeholder:'e.g. CAF100123', type:'text', mono:true },
            { 
              label:t('ponNumber') || 'PON Number', 
              key:'ponNumber', 
              placeholder:'e.g. PON-1', 
              type:'text', 
              mono:true,
              warning: isPonFull 
                ? `PON Full (${ponStats.get(form.ponNumber)}/128)` 
                : null 
            },
            { label:t('phoneNumber'), key:'phone', placeholder:'10-digit number', type:'text' },
            { label:t('connectionDate') || 'Date of Connection', key:'connectionDate', placeholder:'', type:'date' },
            { label:t('monthlyPlan') || 'Package', key:'planName', type:'planSelect' },
            { label:t('address') || 'Address', key:'address', placeholder:'Full address', type:'text' },
            { label:t('area') || 'Area / Zone', key:'area', placeholder:'e.g. North Zone', type:'text' },
            { label:t('notesLabel'), key:'notes', placeholder:'Optional', type:'text', fullWidth: true },
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
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-5 border-t border-[var(--border-color)] bg-[var(--glass-bg)] flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="btn-secondary" style={{ flex:1 }}>{t('cancel')}</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ flex:1 }}>
            {loading ? t('adding') : t('addBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
