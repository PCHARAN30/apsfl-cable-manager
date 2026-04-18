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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
      <div className="text-center max-w-sm w-full fade-up">
        <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
          <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-white" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
        </div>
        <h1 className="text-4xl font-extrabold mb-8">CableSync</h1>
        <div className="w-full py-4 bg-blue-600/40 text-white rounded-2xl font-bold text-xl animate-pulse">
          Entering...
        </div>
      </div>
    </div>
  );
}