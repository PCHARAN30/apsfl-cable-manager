import { useEffect } from 'react';

export default function Login({ onLogin }) {
  const handleOneTap = () => {
    localStorage.setItem('apsfl_userId', 'operator-session');
    onLogin({ username: 'Operator' });
  };

  // Auto-execute the login instantly when this screen appears
  useEffect(() => {
    handleOneTap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-base)] p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/icon-512.png')] bg-cover bg-center opacity-10 blur-sm scale-105 pointer-events-none"></div>
      <div className="relative z-10 text-center max-w-sm w-full fade-up bg-[var(--bg-surface)] p-8 rounded-3xl border border-[var(--border-color)] shadow-2xl">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-white" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
        </div>
        <h1 className="text-3xl font-extrabold mb-2 text-[var(--text-base)]">CableSync</h1>
        <p className="text-[var(--text-muted)] text-sm mb-8 font-medium">Operator Workspace</p>

        <div className="w-full py-4 bg-[var(--surface2)] text-blue-600 dark:text-blue-400 rounded-xl font-bold text-lg flex justify-center items-center gap-3 border border-[var(--border-color)]">
          <svg className="animate-spin w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          Entering...
        </div>
      </div>
    </div>
  );
}