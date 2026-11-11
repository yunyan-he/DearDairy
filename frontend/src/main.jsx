import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DemoApp from './DemoApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {window.location.pathname.startsWith('/demo') ? <DemoApp /> : <App />}
  </StrictMode>,
)
