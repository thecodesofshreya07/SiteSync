import { Loader2 } from 'lucide-react'

export default function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-navy-500">
      <Loader2 size={20} className="animate-spin text-teal-600" />
      <p className="text-xs font-medium">{label}</p>
    </div>
  )
}
