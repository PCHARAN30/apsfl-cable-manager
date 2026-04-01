import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { importCustomers } from '../services/api'
import { useLang } from '../context/LanguageContext'

export default function Import() {
  const { t } = useLang()
  const [file, setFile]       = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const inputRef              = useRef()

  const handleFile = f => {
    const ext = '.'+f.name.split('.').pop().toLowerCase()
    if (!['.csv','.xlsx','.xls','.txt'].includes(ext)) { toast.error('Only CSV, Excel or TXT'); return }
    setFile(f); setResult(null)
  }

  const handleUpload = async () => {
    if (!file) { toast.error('Select a file'); return }
    setLoading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await importCustomers(fd)
      setResult(res.data)
      toast.success(`Imported ${res.data.imported} customers`)
      setFile(null)
    } catch (err) { toast.error(err.response?.data?.message || 'Import failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="page" style={{ maxWidth:640 }}>
      <div className="fade-up" style={{ marginBottom:20 }}>
        <h1 style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:26, color:'white' }}>{t('importCustomers')}</h1>
        <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{t('uploadSubtitle')}</p>
      </div>

      {/* Format guide */}
      <div className="p-5 mt-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-lg fade-up stagger-1 mb-5">
        <p style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:10 }}>
          {t('expectedColumns')}
        </p>
        <div className="font-mono text-sm bg-slate-900/50 rounded-xl p-4 border border-white/5">
          <span style={{ color:'#34d399' }}>name</span>, <span style={{ color:'#fbbf24' }}>phone</span>, <span style={{ color:'#60a5fa' }}>caf</span>
          <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:6, fontFamily:'DM Sans,sans-serif' }}>
            Also accepts: "customer name", "mobile", "caf number", "caf no"…
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e=>{ e.preventDefault(); setDragging(true) }}
        onDragLeave={()=>setDragging(false)}
        onDrop={e=>{ e.preventDefault(); setDragging(false); const f=e.dataTransfer.files[0]; if(f)handleFile(f) }}
        onClick={()=>inputRef.current?.click()}
        className={`fade-up stagger-2 p-12 text-center cursor-pointer border-2 border-dashed rounded-3xl transition-all duration-300 backdrop-blur-xl shadow-2xl ${dragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'}`}
      >
        <input ref={inputRef} type="file" style={{ display:'none' }} accept=".csv,.xlsx,.xls,.txt"
          onChange={e=>e.target.files[0]&&handleFile(e.target.files[0])}/>
        {file ? (
          <>
            <div style={{ width:56, height:56, borderRadius:16, background:'rgba(21,176,112,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <svg className="w-7 h-7" style={{ color:'#34d399' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p style={{ fontWeight:600, color:'white', marginBottom:4 }}>{file.name}</p>
            <p style={{ fontSize:13, color:'var(--text-muted)' }}>{(file.size/1024).toFixed(1)} KB</p>
            <button onClick={e=>{ e.stopPropagation(); setFile(null) }}
              style={{ marginTop:10, fontSize:12, color:'#f87171', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>
              Remove
            </button>
          </>
        ) : (
          <>
            <div style={{ width:56, height:56, borderRadius:16, background:'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <svg className="w-7 h-7" style={{ color:'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
            </div>
            <p style={{ fontWeight:500, color:'#cbd5e1', marginBottom:4 }}>{t('dropFile')}</p>
            <p style={{ fontSize:12, color:'var(--text-muted)' }}>CSV, XLSX, XLS, TXT — max 10 MB</p>
          </>
        )}
      </div>

      {file && (
        <button onClick={handleUpload} disabled={loading} className="btn-primary fade-up" style={{ width:'100%', marginTop:12, padding:'12px 0', fontSize:15 }}>
          {loading ? (
            <span style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
                <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              {t('importing')}
            </span>
          ) : t('importBtn')}
        </button>
      )}

      {result && (
        <div className="p-6 mt-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-xl fade-up">
          <p className="font-semibold text-white mb-4 text-base">{t('importResult')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label:t('totalRows'), value:result.total,    color:'#94a3b8' },
              { label:t('imported'),  value:result.imported, color:'#34d399' },
              { label:t('skipped'),   value:result.skipped,  color:'#fbbf24' },
            ].map((s,i)=>(
              <div key={i} className="p-4 text-center bg-slate-900/50 rounded-xl border border-white/5">
                <p style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:28, color:s.color }}>{s.value}</p>
                <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="p-6 mt-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-xl fade-up stagger-3">
        <p style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:12 }}>
          {t('howToExport')}
        </p>
        <ol style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10 }}>
          {['Login to the APSFL operator portal', 'Go to Subscribers → Export', 'Choose CSV format and download', 'Upload here — duplicates auto-skipped'].map((step,i)=>(
            <li key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', fontSize:14, color:'#94a3b8' }}>
              <span style={{ minWidth:22, height:22, borderRadius:'50%', background:'rgba(21,176,112,0.15)', color:'#34d399', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, marginTop:1 }}>{i+1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
