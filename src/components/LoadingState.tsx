import { Loader2 } from 'lucide-react'

export function LoadingState() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      <Loader2 size={36} className="animate-spin opacity-60" aria-hidden="true" />
      <p className="font-body text-body text-secondary">
        Fetching weather data...
      </p>
    </div>
  )
}
