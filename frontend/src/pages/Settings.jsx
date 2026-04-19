import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useLang } from '../context/LanguageContext'
import { getSettings, updateSettings, markPayment } from '../services/api'

export default function Settings() {
  const { t } = useLang()
  const [loading, setLoading] = useState(false)
  const [companyName, setCompanyName] = useState('CableSync')
  const [plans, setPlans] = useState([])
  const [offlineQueue, setOfflineQueue] = useState([])

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
    
    // Load offline queue
    setOfflineQueue(JSON.parse(localStorage.getItem('offline_payments') || '[]'));
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

  const handleManualSync = async () => {
    if (offlineQueue.length === 0) return;
    toast.loading(`Syncing ${offlineQueue.length} offline payment(s)...`, { id: 'sync' });
    let remaining = [];
    let successCount = 0;
    
    for (const item of offlineQueue) {
      try {
        await markPayment(item.customerId, item.payload);
        successCount++;
      } catch (err) {
        remaining.push(item);
      }
    }
    
    if (remaining.length > 0) {
      localStorage.setItem('offline_payments', JSON.stringify(remaining));
      setOfflineQueue(remaining);
      toast.error(`Synced ${successCount}, but ${remaining.length} failed.`, { id: 'sync' });
    } else {
      localStorage.removeItem('offline_payments');
      setOfflineQueue([]);
      toast.success(`Successfully synced ${successCount} payment(s)!`, { id: 'sync' });
    }
  }

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
        {/* Offline Sync Card */}
        {offlineQueue.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-amber-600 dark:text-amber-500">Offline Payments Pending</h2>
              <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">{offlineQueue.length} Queue</span>
            </div>
            <p className="text-sm text-amber-600/80 dark:text-amber-500/80 mb-4">You have payments saved locally that haven't been uploaded to the server yet.</p>
            <button onClick={handleManualSync} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Sync Now
            </button>
          </div>
        )}

        {/* General Settings Card */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[var(--text-base)] mb-4">{t('generalSettings')}</h2>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 block mb-2">{t('companyName')}</label>
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
                 <div className="w-full sm:w-1/2"><label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">{t('planName')}</label><input type="text" className="input w-full" value={plan.name} onChange={e => updatePlan(plan.id, 'name', e.target.value)} placeholder="e.g., Basic HD" /></div>
                 <div className="w-full sm:w-1/3"><label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">Amount (₹)</label><input type="number" className="input w-full font-mono" value={plan.amount} onChange={e => updatePlan(plan.id, 'amount', Number(e.target.value))} placeholder="300" min="0" /></div>
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