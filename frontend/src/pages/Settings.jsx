import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useLang } from '../context/LanguageContext'
import { getSettings, updateSettings } from '../services/api'

export default function Settings() {
  const { t } = useLang()
  const [loading, setLoading] = useState(false)
  const [companyName, setCompanyName] = useState('CableSync')
  const [plans, setPlans] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSettings();
        if (res.data?.data) {
          setCompanyName(res.data.data.companyName || 'CableSync');
          if (res.data.data.plans) setPlans(res.data.data.plans);
        }
      } catch (err) {
        // Fallback to local storage if backend settings aren't implemented yet
        const localName = localStorage.getItem('cs_companyName');
        if (localName) setCompanyName(localName);
      }
    };
    load();
  }, [])

  const handleSave = async () => {
    if (plans.some(p => !p.name.trim() || p.amount < 0)) {
      toast.error('Please ensure all plans have valid names and amounts.');
      return;
    }
    setLoading(true);
    try {
      // Ensure at least one plan is set as default if plans exist
      let plansToSave = [...plans];
      if (plansToSave.length > 0 && !plansToSave.some(p => p.isDefault)) {
        plansToSave[0].isDefault = true;
      }
      
      await updateSettings({ companyName, plans: plansToSave });
      toast.success('Settings saved successfully');
    } catch (err) {
      // Fallback to local storage to keep UI functional
      localStorage.setItem('cs_companyName', companyName);
      toast.success('Settings saved locally');
    } finally {
      setLoading(false);
    }
  }

  const addPlan = () => setPlans([...plans, { id: Date.now(), name: '', amount: 0, isDefault: plans.length === 0 }])
  const updatePlan = (id, field, value) => setPlans(plans.map(p => p.id === id ? { ...p, [field]: value } : p))
  const removePlan = (id) => setPlans(plans.filter(p => p.id !== id))
  const setAsDefault = (id) => setPlans(plans.map(p => ({ ...p, isDefault: p.id === id })))

  return (
    <div className="page max-w-3xl mx-auto">
      <div className="fade-up flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:26, color:'var(--text-base)' }}>{t('settings')}</h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>Manage your application preferences and plan tiers.</p>
        </div>
        <button onClick={handleSave} disabled={loading} className="btn-primary">
          {loading ? '...' : t('saveSettings')}
        </button>
      </div>

      <div className="space-y-6 fade-up stagger-1">
        {/* General Settings Card */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[var(--text-base)] mb-4">{t('generalSettings')}</h2>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 block mb-2">{t('companyName')}</label>
            <input type="text" className="input w-full md:w-1/2" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g., CableSync Network" />
          </div>
        </div>

        {/* Plan Tiers Card */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-bold text-[var(--text-base)]">{t('subscriptionPlans')}</h2>
             <button onClick={addPlan} className="text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg> {t('addPlan')}</button>
          </div>
          <div className="space-y-3">
            {plans.map((plan) => (
              <div key={plan.id} className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-[var(--surface2)] border border-[var(--border-color)] rounded-xl">
                 <div className="w-full sm:w-1/2"><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">{t('planName')}</label><input type="text" className="input w-full" value={plan.name} onChange={e => updatePlan(plan.id, 'name', e.target.value)} placeholder="e.g., Basic HD" /></div>
                 <div className="w-full sm:w-1/3"><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Amount (₹)</label><input type="number" className="input w-full font-mono" value={plan.amount} onChange={e => updatePlan(plan.id, 'amount', Number(e.target.value))} placeholder="300" min="0" /></div>
                 <div className="w-full sm:w-auto mt-2 sm:mt-5 flex items-center justify-between sm:justify-end gap-4">
                   <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-500 hover:text-[var(--text-base)] transition-colors">
                     <input type="radio" name="defaultPlan" checked={!!plan.isDefault} onChange={() => setAsDefault(plan.id)} className="w-4 h-4 text-emerald-500 bg-[var(--bg-surface)] border-[var(--border-color)] focus:ring-emerald-500 cursor-pointer" />
                     Default
                   </label>
                   <button onClick={() => removePlan(plan.id)} className="p-2.5 rounded-lg text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors" title="Remove Plan"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                 </div>
              </div>
            ))}
            {plans.length === 0 && <div className="text-center py-6 text-slate-500 text-sm">No plans defined. Click "Add Plan" to create one.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}