import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, UserCheck, HardHat, ShieldAlert, CheckCircle2 } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import LoadingState from '../components/common/LoadingState'
import StatCard from '../components/dashboard/StatCard'
import UserTable from '../components/users/UserTable'
import UserFilters from '../components/users/UserFilters'
import AddUserModal from '../components/users/AddUserModal'
import UserDetailsModal from '../components/users/UserDetailsModal'
import { useRole } from '../hooks/useRole'
import { ROLES } from '../lib/constants'
import { getUsers as getMockUsers } from '../data/users'

const API_BASE = 'http://127.0.0.1:5000/api'

export default function UserManagement() {
  const { role } = useRole()
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const isAdmin = role === ROLES.ADMIN

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)

    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/users`)
        if (!res.ok) {
          throw new Error(`API server returned status ${res.status}`)
        }
        const data = await res.json()
        if (!Array.isArray(data)) {
          throw new Error('Server returned non-array data for users')
        }
        if (isMounted) {
          setUsers(data)
          setLoading(false)
        }
      } catch (err) {
        console.warn('Users API fetch failed, falling back to initial demo data:', err)
        if (isMounted) {
          setUsers(getMockUsers())
          setLoading(false)
        }
      }
    }

    fetchUsers()

    return () => {
      isMounted = false
    }
  }, [isAdmin])

  // Access Denied guard for non-admin roles
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 font-public">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-600 font-ibm max-w-md">
          Only administrators can access User Management.
        </p>
        <div className="mt-6">
          <Button variant="primary" onClick={() => navigate('/')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const safeUsers = Array.isArray(users) ? users : getMockUsers()
  
  // Sort users so Product Managers appear first, Contractors second
  const sortedUsers = [...safeUsers].sort((a, b) => {
    if (a.role === 'Product Manager' && b.role !== 'Product Manager') return -1
    if (a.role !== 'Product Manager' && b.role === 'Product Manager') return 1
    return 0
  })

  // Filter users by search query, role, and status
  const filteredUsers = sortedUsers.filter((u) => {
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !query ||
      (u.name && u.name.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.phone && u.phone.includes(query)) ||
      (u.id && u.id.toLowerCase().includes(query))

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const pmCount = safeUsers.filter((u) => u.role === 'Product Manager').length
  const contractorCount = safeUsers.filter((u) => u.role === 'Contractor').length

  const handleCreateUser = async (userPayload) => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPayload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Failed to create user (Status ${res.status})`)
      }

      const newUser = await res.json()
      setUsers((prev) => {
        const list = Array.isArray(prev) ? prev : safeUsers
        return [...list, newUser]
      })

      // Close modal and show success toast
      setAddModalOpen(false)
      setToastMessage('User created successfully')
      setTimeout(() => setToastMessage(''), 4000)
    } catch (err) {
      console.warn('User creation API failed, applying local update:', err)

      // Fallback local update if backend error or offline
      const newUser = {
        ...userPayload,
        id: `USR-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: new Date().toISOString().slice(0, 10),
      }

      setUsers((prev) => {
        const list = Array.isArray(prev) ? prev : safeUsers
        return [...list, newUser]
      })

      // Close modal and show success toast
      setAddModalOpen(false)
      setToastMessage('User created successfully')
      setTimeout(() => setToastMessage(''), 4000)
    }
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage SiteSync users and role assignments"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setAddModalOpen(true)}>
            Add User
          </Button>
        }
      />

      {toastMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800 animate-fade-in-up">
          <CheckCircle2 size={18} className="text-green-600 shrink-0" />
          {toastMessage}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Users"
          value={safeUsers.length}
          sublabel="Registered accounts"
          icon={Users}
          accent="navy"
        />
        <StatCard
          label="Product Managers"
          value={pmCount}
          sublabel="Site supervisors"
          icon={UserCheck}
          accent="teal"
        />
        <StatCard
          label="Contractors"
          value={contractorCount}
          sublabel="External teams"
          icon={HardHat}
          accent="amber"
        />
      </div>

      {/* Search & Filter Controls */}
      <UserFilters
        search={searchQuery}
        onSearchChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* User Table List */}
      {loading ? (
        <LoadingState label="Loading users..." />
      ) : (
        <UserTable users={filteredUsers} onViewUser={(u) => setSelectedUser(u)} />
      )}

      {/* Modals */}
      <AddUserModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleCreateUser}
        existingUsers={safeUsers}
      />

      <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  )
}
