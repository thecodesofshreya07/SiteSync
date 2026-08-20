import EquipmentCard from './EquipmentCard'
import EmptyState from '../common/EmptyState'
import { Wrench } from 'lucide-react'

export default function EquipmentGrid({ equipment }) {
  if (equipment.length === 0) {
    return <EmptyState icon={Wrench} title="No equipment at this site" />
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {equipment.map((eq) => (
        <EquipmentCard key={eq.id} eq={eq} />
      ))}
    </div>
  )
}
