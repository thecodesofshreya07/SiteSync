import { FileSearch } from 'lucide-react'

export default function SourceCitation({ source, onClick }) {
  return (
    <button
      onClick={() => onClick(source)}
      className="flex items-center gap-1.5 rounded-md border border-surface-border bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-800 shadow-sm font-ibm transition-colors"
    >
      <FileSearch size={12} className="text-teal-600" />
      {source.label}
    </button>
  )
}
