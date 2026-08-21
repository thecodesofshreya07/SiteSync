import { Eye, UserX } from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import EmptyState from '../common/EmptyState'
import { useSite } from '../../hooks/useSite'

export default function UserTable({ users, onViewUser }) {
  const { sites } = useSite()

  if (!users || users.length === 0) {
    return (
      <EmptyState
        icon={UserX}
        title="No users found"
        description="Click '+ Add User' to register a new Project Manager or Contractor account."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-surface-border bg-white shadow-card min-w-0">
      <div className="overflow-x-auto min-w-0">
        <table className="w-full text-left text-sm border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-surface-border bg-surface-bg/70 text-2xs font-bold uppercase tracking-wider text-slate-500 font-public">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Assigned Project / Site</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border font-ibm">
            {users.map((user) => {
              const site = sites.find((s) => s.id === user.siteId)
              const roleTone =
                user.role === 'Project Manager'
                  ? 'teal'
                  : user.role === 'Admin'
                  ? 'navy'
                  : user.role === 'Accountant' || user.role === 'Finance'
                  ? 'green'
                  : 'amber'
              const statusTone = user.status === 'Active' ? 'green' : 'neutral'

              const assignmentLabel =
                user.role === 'Project Manager'
                  ? `Project ID: ${user.projectId || 'NA'}`
                  : user.role === 'Admin' || user.role === 'Accountant' || user.role === 'Finance'
                  ? 'All Sites (Global)'
                  : site
                  ? site.name
                  : user.siteId || 'NA'

              return (
                <tr key={user.id} className="hover:bg-teal-50/20 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 font-public">
                    {user.name}
                    <span className="block text-2xs font-normal text-slate-600">{user.id}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge tone={roleTone}>{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-700 truncate max-w-[180px]">
                    {assignmentLabel}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone}>{user.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Eye}
                      onClick={() => onViewUser(user)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
