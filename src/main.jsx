import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/manrope'
import App from './App.jsx'
import './styles.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

const loadingStartedAt = Date.now()

function removeLoadingOverlay() {
  const elapsed = Date.now() - loadingStartedAt
  const remaining = Math.max(0, 2000 - elapsed)

  setTimeout(() => {
    document.getElementById('initial-loading-overlay')?.remove()
  }, remaining)
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

requestAnimationFrame(() => {
  requestAnimationFrame(removeLoadingOverlay)
})




