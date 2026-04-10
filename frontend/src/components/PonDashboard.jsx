import { useState, useEffect } from 'react'
import { getPonStats } from '../services/api'

export default function PonDashboard() {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPonStats()
      .then(res => setStats(res.data.data))
      .catch(err => console.error('Failed to load PON stats', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-6 text-center text-slate-400 animate-pulse">Loading PON capacity...</div>
  }

  return (
    <div className="bg-[var(--surface2)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-lg">
      <div className="p-5 border-b border-[var(--border-color)] bg-[var(--glass-bg)] flex justify-between items-center">
        <h3 className="font-bold text-lg text-[var(--text-base)] flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          PON Capacity Overview
        </h3>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-widest text-slate-500 bg-[var(--bg-surface)]">
              <th className="p-4 font-semibold">PON ID</th>
              <th className="p-4 font-semibold">Used</th>
              <th className="p-4 font-semibold">Available</th>
              <th className="p-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)] text-sm">
            {stats.map(s => {
              const used = s.count;
              const available = 128 - used;
              const isFull = used >= 128;
              const isWarning = used >= 115 && !isFull;

              return (
                <tr key={s._id} className="hover:bg-[var(--glass-bg)] transition-colors">
                  <td className="p-4 font-bold text-[var(--text-base)]">{s._id}</td>
                  <td className="p-4 text-[var(--text-muted)]">{used} / 128</td>
                  <td className="p-4">
                    <span className={`font-mono font-bold ${isFull ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {isFull ? '0' : available}
                    </span>
                  </td>
                  <td className="p-4">
                    {isFull ? (
                      <span className="px-2 py-1 rounded-md bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider">Full</span>
                    ) : isWarning ? (
                      <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider">Filling Fast</span>
                    ) : (
                      <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Available</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {stats.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-500">No PON connections recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}