import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'
import { runDiagnostics } from '@/lib/diagnostics.ts'

// Expose diagnostics via browser console: nimbus.diagnose()
const nimbus = {
  diagnose: async () => {
    const result = await runDiagnostics()
    console.table(result.checks.map((c) => ({ Component: c.name, Status: c.status, Latency: c.latencyMs ? `${c.latencyMs}ms` : '—', Detail: c.detail })))
    console.log(`Overall: ${result.overall} | ${result.timestamp}`)
    return result
  },
}
Object.assign(globalThis, { nimbus })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
