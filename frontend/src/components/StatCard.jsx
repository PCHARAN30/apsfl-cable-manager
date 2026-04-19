export default function StatCard({ label, value, sub, accent, icon: Icon }) {
  const accents = {
    green:  { bg: 'bg-brand-500/10', text: 'text-brand-400', border: 'border-brand-500/20' },
    red:    { bg: 'bg-red-500/10',   text: 'text-red-400',   border: 'border-red-500/20' },
    amber:  { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    blue:   { bg: 'bg-blue-500/10',  text: 'text-blue-400',  border: 'border-blue-500/20' },
    purple: { bg: 'bg-purple-500/10',text: 'text-purple-400',border: 'border-purple-500/20' },
  }
  const c = accents[accent] || accents.blue

  return (
    <div className={`card p-5 border ${c.border} fade-up`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{label}</p>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${c.text}`} />
          </div>
        )}
      </div>
      <p className={`font-display text-2xl font-bold ${c.text}`}>{value}</p>
      {sub && <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">{sub}</p>}
    </div>
  )
}
