import Badge from '../common/Badge'

function toneFor(status) {
  const s = status.toLowerCase()
  if (s.includes('delayed')) return 'red'
  if (s.includes('completed')) return 'green'
  if (s.includes('approved')) return 'blue'
  if (s.includes('pending') || s.includes('awaiting')) return 'amber'
  return 'neutral'
}

export default function ProcurementStatusBadge({ status }) {
  return <Badge tone={toneFor(status)}>{status}</Badge>
}
