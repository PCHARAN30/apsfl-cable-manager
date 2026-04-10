import { useState } from 'react'
import toast from 'react-hot-toast'
import { markUpToDate } from '../services/api'
import { useLang } from '../context/LanguageContext'

export default function UpToDateModal({ customer, onClose, onSuccess }) {
  const { t } = useLang()
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!targetDate) {
      toast.error('Please select a date.')
      return
    }
    
    const date = new Date(targetDate);
    if (isNaN(date)) { toast.error('Invalid date format'); return; }

    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    const nextMonthStr = nextMonth.toLocaleString("default", { month: "long", year: "numeric" });

    if (!window.confirm(`This will clear all of ${customer.name}'s payment history and reset their billing to start fresh from ${nextMonthStr}.\n\nAll dues before this date will be ignored. This action cannot be undone. Are you sure?`)) return;

    setLoading(true)
    try {
      await markUpToDate(customer._id, { targetDate })
      toast.success(`Billing for ${customer.name} reset successfully.`)
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset billing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}/>
      <div className="relative w-full max-w-[440px] p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl shadow-black/60 scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display font-bold text-lg text-[var(--text-base)]">Reset Billing for {customer.name}</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors p-1.5 rounded-full hover:bg-[var(--surface2)]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-2">Mark all dues as cleared up to:</span>
            <input type="date" className="input w-full" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
            <p className="text-xs text-slate-500 mt-2">The customer's next bill will be due for the month following the date you select.</p>
          </label>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="btn-secondary w-full">{t('cancel')}</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full">{loading ? 'Resetting...' : 'Confirm Reset'}</button>
        </div>
      </div>
    </div>
  )
}