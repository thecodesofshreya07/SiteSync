import Badge from '../common/Badge'

const TONE_MAP = {
  OK: 'green',
  LOW: 'amber',
  CRITICAL: 'red',
}

export default function InventoryStatusBadge({ status }) {
  return <Badge tone={TONE_MAP[status] || 'neutral'}>{status}</Badge>
}
