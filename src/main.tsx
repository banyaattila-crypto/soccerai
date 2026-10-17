import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA Service Worker regisztráció
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ SoccerAI PWA Service Worker sikeresen regisztrálva:', registration.scope);
      })
      .catch((error) => {
        console.warn('❌ Service Worker regisztrációs hiba:', error);
      });
  });
}

