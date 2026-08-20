import { useState, useRef, useEffect } from 'react'
import { ChevronDown, MapPin, Check } from 'lucide-react'
import { useSite } from '../../hooks/useSite'
import { cn } from '../../lib/utils'

const STATUS_TONE = {
  'On Track': 'text-green-600',
  'At Risk': 'text-amber-600',
  Delayed: 'text-red-600',
}

export default function SiteSelector() {
  const { sites, selectedSite, setSelectedSiteId } = useSite()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-surface-border bg-white px-3 py-1.5 text-left hover:border-navy-600/30"
      >
        <MapPin size={15} className="shrink-0 text-teal-600" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-navy-900">{selectedSite.name}</p>
        </div>
        <ChevronDown size={14} className={cn('shrink-0 text-navy-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-1.5 w-72 rounded-lg border border-surface-border bg-white p-1.5 shadow-pop">
          {sites.map((site) => (
            <button
              key={site.id}
              onClick={() => {
                setSelectedSiteId(site.id)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-start justify-between gap-2 rounded-md px-2.5 py-2 text-left hover:bg-surface-bg',
                site.id === selectedSite.id && 'bg-teal-50/60'
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-navy-900">{site.name}</p>
                <p className="truncate text-2xs text-navy-500">{site.location}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                <span className={cn('text-2xs font-semibold', STATUS_TONE[site.status] || 'text-navy-500')}>
                  {site.status}
                </span>
                {site.id === selectedSite.id && <Check size={13} className="text-teal-600" />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
