import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useLang } from '../context/LanguageContext'
import { getSettings, updateSettings, markPayment, resetSerials } from '../services/api'

export default function Settings() {
  const { t } = useLang()
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('CableSync')
  const [plans, setPlans] = useState([])
  const [offlineQueue, setOfflineQueue] = useState([])
  const [isInstallable, setIsInstallable] = useState(!!window.deferredPrompt)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getSettings();
        if (res.data?.data) {
          setUserName(res.data.data.companyName || 'CableSync');
          if (res.data.data.plans) setPlans(res.data.data.plans);
        }
      } catch (err) {
        // Fallback to local storage if backend settings aren't implemented yet
        const localName = localStorage.getItem('cs_userName');
        if (localName) setUserName(localName);
      }
    };
    load();
    
    // Load offline queue
    setOfflineQueue(JSON.parse(localStorage.getItem('offline_payments') || '[]'));

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setIsInstallable(true);
    };
    
    if (window.deferredPrompt) setIsInstallable(true);
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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
      
      await updateSettings({ companyName: userName, plans: plansToSave });
      toast.success('Settings saved successfully');
    } catch (err) {
      // Fallback to local storage to keep UI functional
      localStorage.setItem('cs_userName', userName);
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

  const handleInstall = async () => {
    if (!window.deferredPrompt) return;
    window.deferredPrompt.prompt();
    const { outcome } = await window.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      window.deferredPrompt = null;
    }
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out completely? This will remove your app password and session from this device.')) {
      localStorage.removeItem('apsfl_userId');
      localStorage.removeItem('app_pin_hash');
      localStorage.removeItem('app_remember_me');
      sessionStorage.removeItem('session_unlocked');
      localStorage.removeItem('app_last_active');
      localStorage.removeItem('app_offline_since');
      window.location.reload();
    }
  }

  const handleResetSerials = async () => {
    if (!window.confirm('Are you sure you want to re-sequence all customer serial numbers sequentially starting from 1?')) return;
    try {
      await resetSerials();
      toast.success('Serial numbers reset successfully');
    } catch (err) {
      toast.error('Failed to reset serial numbers');
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

        {/* App Installation Card */}
        {isInstallable && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-blue-600 dark:text-blue-400">Install CableSync App</h2>
            </div>
            <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mb-4">Install this application on your home screen for quick access and a better full-screen experience.</p>
            <button onClick={handleInstall} className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Install App Now
            </button>
          </div>
        )}

        {/* General Settings Card */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[var(--text-base)] mb-4">{t('generalSettings')}</h2>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 block mb-2">{t('userName')}</label>
            <input type="text" className="input w-full md:w-1/2" value={userName} onChange={e => setUserName(e.target.value)} placeholder="e.g., Ramesh (Operator)" />
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

      {/* Data Management */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[var(--text-base)] mb-4">Data Management</h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)]">Re-sequence all customer serial numbers sequentially starting from 1.</p>
          <button onClick={handleResetSerials} className="whitespace-nowrap px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
            Reset Serial Numbers
          </button>
        </div>
      </div>

        {/* Danger Zone */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-red-600 dark:text-red-500 mb-4">Danger Zone</h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-red-600/80 dark:text-red-500/80">Log out completely from this device. This will remove your app lock password.</p>
            <button onClick={handleLogout} className="whitespace-nowrap px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Log Out Device
            </button>
          </div>
        </div>
      </div>

      {/* Floating Logout Button (Mobile) */}
      <button
        onClick={handleLogout}
        className="md:hidden fixed bottom-[80px] left-4 z-40 w-12 h-12 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 rounded-xl shadow-lg flex items-center justify-center active:scale-90 transition-all"
        title="Logout"
      >
        <svg className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
      </button>

      {/* Floating Install Button (Mobile) */}
      {isInstallable && (
        <div className="md:hidden fixed bottom-[80px] right-4 z-40">
          <span className="absolute inset-0 rounded-xl bg-blue-400 animate-ping opacity-75"></span>
          <button
            onClick={handleInstall}
            className="relative w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/40 flex items-center justify-center active:scale-90 transition-all"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}