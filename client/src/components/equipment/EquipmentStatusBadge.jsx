import Badge from '../common/Badge'

const TONE_MAP = {
  Active: 'green',
  Idle: 'amber',
  Maintenance: 'blue',
}

export default function EquipmentStatusBadge({ status }) {
  return <Badge tone={TONE_MAP[status] || 'neutral'}>{status}</Badge>
}
