import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border bg-white/60 px-6 py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-navy-900/5 text-navy-400">
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-navy-800">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs text-navy-500">{description}</p>}
    </div>
  )
}
