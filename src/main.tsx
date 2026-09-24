import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// for anyone who opens the console on a designer's portfolio
console.log(
  '%chi, curious one 👋%c\nthis site was designed by sneha jain, pinned lever and all.\nif you’re hiring, the fastest way in: heyiamsnehajain@gmail.com',
  'font: 600 18px Geist, system-ui, sans-serif; color: #7c5cf0;',
  'font: 13px "Geist Mono", ui-monospace, monospace; color: #57534e; line-height: 1.6;',
)
