import { User, Mail, ShieldCheck, FolderGit2, MapPin, LogOut } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import { useAuth } from '../hooks/useAuth'

function SettingRow({ icon: Icon, label, value, right }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border px-4 py-3.5 last:border-0 min-w-0">
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-900/5 text-navy-500 mt-0.5 sm:mt-0">
          <Icon size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-navy-800 break-words">{label}</p>
          {value && <p className="text-xs text-navy-500 break-words">{value}</p>}
        </div>
      </div>
      {right && <div className="shrink-0 pl-11 sm:pl-0">{right}</div>}
    </div>
  )
}

export default function Settings() {
  const { user, logout } = useAuth()

  return (
    <div>
      <PageHeader title="Settings" subtitle="Authenticated user account and environment preferences" />

      <div className="max-w-xl space-y-6">
        <div className="rounded-xl border border-surface-border bg-white shadow-card p-5 space-y-4">
          <div className="border-b border-surface-border pb-3">
            <h3 className="text-base font-bold text-navy-900">Authenticated Account Profile</h3>
            <p className="text-xs text-navy-500">JWT identity verified by Express backend</p>
          </div>

          <div className="divide-y divide-surface-border">
            <SettingRow icon={User} label="Full Name" value={user?.name || '—'} />
            <SettingRow icon={Mail} label="Email Address" value={user?.email || '—'} />
            <SettingRow
              icon={ShieldCheck}
              label="Assigned Role"
              right={<Badge tone="teal">{user?.role || 'Guest'}</Badge>}
            />
            <SettingRow
              icon={FolderGit2}
              label="Assigned Project UID"
              value={user?.projectUid && user.projectUid !== 'NA' ? user.projectUid : 'N/A'}
            />
            <SettingRow
              icon={MapPin}
              label="Assigned Site ID"
              value={user?.siteId && user.siteId !== 'NA' ? user.siteId : 'N/A'}
            />
          </div>

          <div className="pt-3 border-t border-surface-border flex justify-end">
            <Button
              variant="danger"
              icon={LogOut}
              onClick={logout}
              className="cursor-pointer"
            >
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
