import { useState } from 'react'
import Button from '../common/Button'
import { useSite } from '../../hooks/useSite'

const ALLOWED_ROLES = ['Product Manager', 'Contractor', 'Accountant']

export default function UserForm({ onSubmit, onClose, existingUsers = [] }) {
  const { sites } = useSite()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('Product Manager')
  const [projectId, setProjectId] = useState('PROJECT-001')
  const [siteId, setSiteId] = useState('SITE-002')
  const [status, setStatus] = useState('Active')

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  function validate() {
    const errs = {}
    if (!name.trim()) {
      errs.name = 'Full Name is required'
    }
    if (!email.trim()) {
      errs.email = 'Email is required'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        errs.email = 'Please enter a valid email address'
      }
    }
    if (!phone.trim()) {
      errs.phone = 'Phone Number is required'
    }
    if (!role) {
      errs.role = 'Role is required'
    }

    // Duplicate email check
    const normalizedEmail = email.trim().toLowerCase()
    if (!errs.email && existingUsers.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      errs.email = 'A user with this email already exists.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')

    if (!validate()) return

    setSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        projectId: role === 'Product Manager' ? (projectId.trim() || 'PROJECT-001') : 'NA',
        siteId: role === 'Contractor' ? (siteId.trim() || 'SITE-002') : 'NA',
        status: status || 'Active',
      })
    } catch (err) {
      setServerError(err.message || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-public">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          {serverError}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 font-public">
          Full Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
          }}
          placeholder="e.g. Rahul Sharma"
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-ibm"
        />
        {errors.name && <p className="mt-1 text-xs font-semibold text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 font-public">
          Email Address *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
          }}
          placeholder="rahul@example.com"
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-ibm"
        />
        {errors.email && <p className="mt-1 text-xs font-semibold text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 font-public">
          Phone Number *
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value)
            if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }))
          }}
          placeholder="+91 98765 43210"
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-ibm"
        />
        {errors.phone && <p className="mt-1 text-xs font-semibold text-red-600">{errors.phone}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 font-public">
            Role *
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white font-ibm"
          >
            {ALLOWED_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {errors.role && <p className="mt-1 text-xs font-semibold text-red-600">{errors.role}</p>}
        </div>

        <div>
          {role === 'Product Manager' ? (
            <>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 font-public">
                Assigned Project UID
              </label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="e.g. PROJECT-001"
                className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-ibm"
              />
            </>
          ) : role === 'Contractor' ? (
            <>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 font-public">
                Assigned Site ID
              </label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white font-ibm"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))}
              </select>
            </>
          ) : (
            <div className="pt-6 text-xs text-slate-500 font-medium">
              Accountant role has global procurement/budget permissions.
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700 font-public">
          Account Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white font-ibm"
        >
          <option value="Active">Active</option>
          <option value="Not Active">Not Active</option>
        </select>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Creating User...' : 'Add User'}
        </Button>
      </div>
    </form>
  )
}
