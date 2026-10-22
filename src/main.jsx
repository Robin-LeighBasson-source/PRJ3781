import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/manrope'
import App from './App.jsx'
import './styles.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

function removeLoadingOverlay() {
  document.getElementById('initial-loading-overlay')?.remove()
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

requestAnimationFrame(() => {
  requestAnimationFrame(removeLoadingOverlay)
})




