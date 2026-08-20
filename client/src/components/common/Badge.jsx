import { cn } from '../../lib/utils'

const TONES = {
  neutral: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
  teal: 'bg-teal-50 text-teal-800 border-teal-200 font-bold',
  amber: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
  red: 'bg-red-50 text-red-800 border-red-200 font-bold',
  green: 'bg-green-50 text-green-800 border-green-200 font-bold',
  blue: 'bg-blue-50 text-blue-800 border-blue-200 font-bold',
}

export default function Badge({ children, tone = 'neutral', className, dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wider',
        TONES[tone] || TONES.neutral,
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
