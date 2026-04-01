import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { LanguageProvider } from './context/LanguageContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0f1929',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            },
            success: { iconTheme: { primary: '#15b070', secondary: '#080e1a' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#080e1a' } },
            duration: 3000,
          }}
        />
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
)
