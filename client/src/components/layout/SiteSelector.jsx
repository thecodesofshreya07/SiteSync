import { useState, useRef, useEffect } from 'react'
import { ChevronDown, MapPin, Check } from 'lucide-react'
import { useSite } from '../../hooks/useSite'
import { useAuth } from '../../hooks/useAuth'
import { sites as defaultMockSites } from '../../data/sites'
import { cn } from '../../lib/utils'

const STATUS_TONE = {
  'On Track': 'text-green-600',
  'At Risk': 'text-amber-600',
  Delayed: 'text-red-600',
}

export default function SiteSelector() {
  const { user } = useAuth()
  const { sites, selectedSite, setSelectedSiteId } = useSite()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const activeSites = Array.isArray(sites) && sites.length > 0 ? sites : defaultMockSites
  const isContractor = user?.role === 'Contractor'

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (isContractor) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-slate-50 px-2.5 sm:px-3 py-1.5 text-left max-w-[200px] sm:max-w-xs shadow-xs">
        <MapPin size={15} className="shrink-0 text-teal-600" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs sm:text-sm font-semibold leading-tight text-navy-900">
            {selectedSite?.name || 'Assigned Site'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-w-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-2.5 sm:px-3 py-1.5 text-left hover:border-navy-600/30 max-w-[200px] sm:max-w-xs cursor-pointer shadow-xs"
      >
        <MapPin size={15} className="shrink-0 text-teal-600" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs sm:text-sm font-semibold leading-tight text-navy-900">
            {selectedSite?.name || 'Select Site'}
          </p>
        </div>
        <ChevronDown size={14} className={cn('shrink-0 text-navy-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-64 sm:w-72 rounded-lg border border-surface-border bg-white p-1.5 shadow-xl max-w-[calc(100vw-2rem)]">
          {activeSites.map((site) => {
            const isSelected = site.id === selectedSite?.id
            return (
              <button
                key={site.id}
                type="button"
                onClick={() => {
                  setSelectedSiteId(site.id)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-start justify-between gap-2 rounded-md px-2.5 py-2 text-left hover:bg-surface-bg transition-colors cursor-pointer',
                  isSelected && 'bg-teal-50/70 font-semibold'
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-navy-900">{site.name}</p>
                  <p className="truncate text-2xs text-navy-500">{site.location}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                  <span className={cn('text-2xs font-semibold', STATUS_TONE[site.status] || 'text-navy-500')}>
                    {site.status}
                  </span>
                  {isSelected && <Check size={13} className="text-teal-600 shrink-0" />}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
