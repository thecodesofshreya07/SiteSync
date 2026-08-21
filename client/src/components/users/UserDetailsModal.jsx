import Modal from '../common/Modal'
import Badge from '../common/Badge'
import { useSite } from '../../hooks/useSite'
import { formatDate } from '../../lib/utils'

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 border-b border-surface-border py-2.5 last:border-0 font-public min-w-0">
      <span className="text-xs font-semibold text-slate-500 font-public shrink-0">{label}</span>
      <span className="sm:text-right text-xs font-bold text-slate-900 font-ibm break-words min-w-0">{value}</span>
    </div>
  )
}

export default function UserDetailsModal({ user, onClose }) {
  const { sites } = useSite()

  if (!user) return null

  const assignedSite = sites.find((s) => s.id === user.siteId)
  const roleTone =
    user.role === 'Project Manager'
      ? 'teal'
      : user.role === 'Admin'
      ? 'navy'
      : user.role === 'Accountant' || user.role === 'Finance'
      ? 'green'
      : 'amber'
  const statusTone = user.status === 'Active' ? 'green' : 'neutral'

  return (
    <Modal open={!!user} onClose={onClose} title="User Details" subtitle={`System Account · ${user.id}`}>
      <div className="space-y-4 font-public">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div>
            <h3 className="text-base font-bold text-navy-900">{user.name}</h3>
            <p className="text-xs text-navy-500 font-ibm">{user.email}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge tone={roleTone}>{user.role}</Badge>
            <Badge tone={statusTone}>{user.status}</Badge>
          </div>
        </div>

        <div className="rounded-lg bg-surface-bg p-3">
          <Row label="Full Name" value={user.name} />
          <Row label="Email Address" value={user.email} />
          <Row label="Phone Number" value={user.phone} />
          <Row label="Assigned Role" value={user.role} />
          {user.role === 'Project Manager' ? (
            <Row label="Assigned Project ID" value={user.projectId || 'NA'} />
          ) : user.role === 'Admin' || user.role === 'Accountant' || user.role === 'Finance' ? (
            <Row label="Scope" value="All Sites (Global Access)" />
          ) : (
            <Row label="Assigned Site" value={assignedSite ? `${assignedSite.name} (${assignedSite.location})` : (user.siteId || 'NA')} />
          )}
          <Row label="Account Status" value={user.status} />
          <Row label="Created Date" value={user.createdAt ? formatDate(user.createdAt) : 'N/A'} />
        </div>
      </div>
    </Modal>
  )
}
