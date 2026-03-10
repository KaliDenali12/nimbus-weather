import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface ToastProps {
  message: string
  duration?: number
  onDismiss: () => void
}

export function Toast({ message, duration = 5000, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 200) // wait for fade-out
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
        px-4 py-3 rounded-dropdown
        backdrop-blur-[20px] transition-opacity duration-200
        ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{
        background: 'rgba(20, 30, 50, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <span className="font-body text-[14px] font-medium text-white/90">
        {message}
      </span>
      <button
        onClick={() => { setVisible(false); setTimeout(onDismiss, 200) }}
        className="ml-1 p-0.5 hover:bg-white/10 rounded transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={14} className="text-white/60" />
      </button>
    </div>
  )
}
