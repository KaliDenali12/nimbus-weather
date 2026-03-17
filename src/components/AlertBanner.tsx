import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useWeather } from '@/context/WeatherContext.tsx'
import type { WeatherAlert } from '@/types/index.ts'

const severityStyles: Record<WeatherAlert['severity'], { bg: string; border: string; text: string }> = {
  advisory: {
    bg: 'rgba(251, 191, 36, 0.2)',
    border: 'rgba(251, 191, 36, 0.4)',
    text: '#fbbf24',
  },
  warning: {
    bg: 'rgba(251, 146, 60, 0.2)',
    border: 'rgba(251, 146, 60, 0.4)',
    text: '#fb923c',
  },
  emergency: {
    bg: 'rgba(248, 113, 113, 0.2)',
    border: 'rgba(248, 113, 113, 0.4)',
    text: '#f87171',
  },
}

export function AlertBanner() {
  const { weather } = useWeather()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  if (!weather) return null

  const visibleAlerts = weather.alerts.filter((a) => !dismissed.has(a.id))
  if (visibleAlerts.length === 0) return null

  return (
    <div className="flex flex-col gap-3" role="alert">
      {visibleAlerts.map((alert) => {
        const style = severityStyles[alert.severity]
        return (
          <div
            key={alert.id}
            className="relative px-4 py-3 rounded-dropdown"
            style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
            }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} style={{ color: style.text }} className="shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-[14px] font-bold" style={{ color: style.text }}>
                  {alert.event}
                </p>
                <p className="text-body-sm mt-1 text-secondary">
                  {alert.description}
                </p>
              </div>
              <button
                className="p-1 hover:bg-white/10 rounded transition-colors shrink-0"
                onClick={() => setDismissed((prev) => new Set([...prev, alert.id]))}
                aria-label={`Dismiss ${alert.event} alert`}
              >
                <X size={14} style={{ color: style.text }} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
