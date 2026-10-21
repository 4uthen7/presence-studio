import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/base.css'
import './styles/components.css'
import './styles/views.css'
import { installBrowserMock } from './lib/browserMock'

if (!window.presenceStudio) installBrowserMock()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
