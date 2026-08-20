import { Link2 } from 'lucide-react'

export default function DependencyBadge({ dependency }) {
  if (!dependency) return null
  return (
    <div className="mt-2 flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-2xs font-medium text-amber-700">
      <Link2 size={11} />
      <span className="truncate">{dependency}</span>
    </div>
  )
}
