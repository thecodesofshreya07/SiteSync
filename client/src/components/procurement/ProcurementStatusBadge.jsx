import Badge from '../common/Badge'

function toneFor(status) {
  if (!status) return 'neutral'
  const s = String(status).toLowerCase()
  if (s.includes('rejected') || s.includes('disapproved') || s.includes('delayed')) return 'red'
  if (s.includes('completed') || s.includes('delivered') || s.includes('inventory updated')) return 'green'
  if (s.includes('approved')) return 'blue'
  if (s.includes('pending') || s.includes('awaiting')) return 'amber'
  return 'neutral'
}

export default function ProcurementStatusBadge({ status }) {
  return <Badge tone={toneFor(status)}>{status}</Badge>
}
