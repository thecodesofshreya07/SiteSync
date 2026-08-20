import { FileSearch } from 'lucide-react'

export default function SourceCitation({ source, onClick }) {
  return (
    <button
      onClick={() => onClick(source)}
      className="flex items-center gap-1 rounded-md border border-surface-border bg-white px-2 py-1 text-2xs font-medium text-navy-600 hover:border-teal-300 hover:text-teal-700"
    >
      <FileSearch size={11} />
      {source.label}
    </button>
  )
}
