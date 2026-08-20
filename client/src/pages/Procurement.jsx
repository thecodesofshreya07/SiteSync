import { useState } from 'react'
import { LayoutGrid, Table2 } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import ProcurementPipeline from '../components/procurement/ProcurementPipeline'
import ProcurementTable from '../components/procurement/ProcurementTable'
import { useSite } from '../hooks/useSite'
import { getProcurementBySite } from '../data/procurement'
import { cn } from '../lib/utils'

export default function Procurement() {
  const { selectedSite } = useSite()
  const [view, setView] = useState('pipeline')
  const orders = getProcurementBySite(selectedSite.id)

  return (
    <div>
      <PageHeader
        title="Procurement"
        subtitle={`Purchase pipeline for ${selectedSite.name}`}
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-surface-border bg-white p-1">
            <button
              onClick={() => setView('pipeline')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                view === 'pipeline' ? 'bg-teal-600 text-white' : 'text-navy-600 hover:bg-surface-bg'
              )}
            >
              <LayoutGrid size={13} />
              Pipeline
            </button>
            <button
              onClick={() => setView('table')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                view === 'table' ? 'bg-teal-600 text-white' : 'text-navy-600 hover:bg-surface-bg'
              )}
            >
              <Table2 size={13} />
              Table
            </button>
          </div>
        }
      />

      {view === 'pipeline' ? <ProcurementPipeline orders={orders} /> : <ProcurementTable orders={orders} />}
    </div>
  )
}
