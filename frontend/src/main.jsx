import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DemoApp from './DemoApp.jsx'

const path = window.location.pathname.replace(/\/$/, '') || '/'

if (path === '/en') window.history.replaceState({}, '', '/')
if (path === '/zh') window.history.replaceState({}, '', '/cn')

const currentPath = window.location.pathname.replace(/\/$/, '') || '/'
const isChinese = currentPath === '/cn' || currentPath.startsWith('/cn/')
const isDemo = currentPath === '/demo' || currentPath === '/cn/demo'
const isLocalJournal = currentPath === '/journal' || currentPath === '/cn/journal'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isDemo || isLocalJournal
      ? <DemoApp lang={isChinese ? 'zh' : 'en'} mode={isLocalJournal ? 'local' : 'demo'} />
      : <App />}
  </StrictMode>,
)
