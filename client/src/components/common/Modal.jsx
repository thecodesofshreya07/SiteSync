import { X } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from '../../lib/utils'

export default function Modal({ open, onClose, title, subtitle, children, width = 'max-w-lg' }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-navy-950/60 backdrop-blur-[2px] animate-fade-in-up"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full rounded-xl bg-white shadow-pop animate-fade-in-up max-h-[90vh] overflow-y-auto max-w-[calc(100vw-1.5rem)] min-w-0',
          width
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-surface-border bg-white px-4 sm:px-5 py-3.5 sm:py-4 rounded-t-xl">
          <div className="min-w-0 pr-2">
            <h2 className="text-sm sm:text-base font-bold text-navy-900 break-words">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-navy-600 break-words">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-navy-500 hover:bg-navy-900/5 hover:text-navy-800 shrink-0"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-4 sm:px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
