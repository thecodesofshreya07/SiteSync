export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3 min-w-0">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold text-navy-900 break-words">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs sm:text-sm text-navy-600 break-words">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
