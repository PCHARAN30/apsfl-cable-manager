import { useState } from 'react'
import toast from 'react-hot-toast'
import { updateCustomer } from '../services/api'
import { useLang } from '../context/LanguageContext'

export default function EditCustomerModal({ customer, onClose, onSuccess }) {
  const { t } = useLang()
  
  // Initialize form with customer's existing data
  const [form, setForm] = useState({ 
    name: customer.name || '', 
    phone: customer.phone || '', 
    address: customer.address || '', 
    planAmount: customer.planAmount || 300, 
    notes: customer.notes || '', 
    connectionDate: customer.connectionDate ? customer.connectionDate.split('T')[0] : '' 
  })
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setLoading(true)
    try { 
      await updateCustomer(customer._id, form); 
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}/>
      <div className="relative w-full max-w-[440px] p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl shadow-black/60 scale-in">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:18, color:'var(--text-base)' }}>{t('editCustomer')}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[
            { label:t('customerName'), key:'name', placeholder:'Full name', type:'text' },
            { label:t('phoneNumber'), key:'phone', placeholder:'10-digit number', type:'text' },
            { label:t('connectionDate') || 'Date of Connection', key:'connectionDate', placeholder:'', type:'date' },
            { label:t('address') || 'Address', key:'address', placeholder:'Full address', type:'text' },
            { label:t('monthlyPlan'), key:'planAmount', placeholder:'300', type:'number', mono:true },
            { label:t('notesLabel'), key:'notes', placeholder:'Optional', type:'text' },
          ].map(f => (
            <div key={f.key}>
              <span style={lbl}>{f.label}</span>
              <input type={f.type} className="input" style={f.mono?{fontFamily:'JetBrains Mono,monospace'}:{}}
                value={form[f.key]} onChange={e=>set(f.key, e.target.value)} placeholder={f.placeholder}/>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex:1 }}>{t('cancel')}</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ flex:1 }}>
            {loading ? t('updating') : t('saveChanges')}
          </button>
        </div>
      </div>
    </div>
  )
}