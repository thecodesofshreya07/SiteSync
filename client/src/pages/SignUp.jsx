import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Mail, User, Phone, ArrowRight, Check, ShieldAlert, Sparkles, Building2, Briefcase, HardHat, FileSpreadsheet, ShieldCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const ROLES_INFO = [
  {
    id: 'Project Manager',
    title: 'Project Manager',
    desc: 'Multi-site operational command, AI autonomous alerts, budget tracking & photo scan verifications.',
    icon: Briefcase,
    color: 'border-teal-500/50 bg-teal-950/20 text-teal-400',
  },
  {
    id: 'Contractor',
    title: 'Contractor / Field Engineer',
    desc: 'On-ground field supervisor. Logs daily concrete & steel consumption, submits material PO requests.',
    icon: HardHat,
    color: 'border-amber-500/50 bg-amber-950/20 text-amber-400',
  },
  {
    id: 'Accountant',
    title: 'Accountant / Finance Manager',
    desc: 'Financial clearance, purchase order approvals, vendor invoice auditing, and budget limits.',
    icon: FileSpreadsheet,
    color: 'border-blue-500/50 bg-blue-950/20 text-blue-400',
  },
  {
    id: 'Admin',
    title: 'Administrator',
    desc: 'Global workspace privileges, cross-site analytics, user account provisioning & system control.',
    icon: ShieldCheck,
    color: 'border-purple-500/50 bg-purple-950/20 text-purple-400',
  },
]

export default function SignUp() {
  const navigate = useNavigate()
  const { signup } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Project Manager')
  const [siteId, setSiteId] = useState('SITE-001')
  const [projectId, setProjectId] = useState('1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await signup({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
        phone: phone.trim() || '+91 98000 12345',
        siteId: role === 'Contractor' ? siteId : 'NA',
        projectId: role === 'Project Manager' ? projectId : 'NA',
      })
      setSuccess(true)
      setTimeout(() => {
        navigate('/dashboard')
      }, 1200)
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100 font-public selection:bg-teal-500 selection:text-white">
      <div className="w-full max-w-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white p-2 shadow-lg shadow-teal-500/10 hover:scale-105 transition-transform">
            <img
              src="/sitesync_logo.png"
              alt="SiteSync Logo"
              className="h-full w-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-public">Create Your Account</h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-400 font-ibm">
            Autonomous Construction Intelligence Platform
          </p>
        </div>

        {/* SignUp Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl space-y-5 font-ibm backdrop-blur-md">
          {success ? (
            <div className="py-10 text-center space-y-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                <Check size={28} strokeWidth={3} />
              </div>
              <h3 className="text-xl font-bold text-white font-public">Account Registered Successfully!</h3>
              <p className="text-xs text-slate-400">Storing in SiteSync database & launching workspace session...</p>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white font-public">Enterprise User Registration</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Register a new user with dedicated role permissions and database persistence.
                  </p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-teal-400 bg-teal-950/60 border border-teal-800/40 px-2 py-0.5 rounded-full">
                  <Sparkles size={12} /> DB Synced
                </span>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/60 p-3 text-xs text-red-300">
                  <ShieldAlert size={16} className="shrink-0 text-red-400 mt-0.5" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1 font-public">
                      Full Name <span className="text-teal-400">*</span>
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1 font-public">
                      Work Email <span className="text-teal-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@sitesync.com"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1 font-public">
                      Phone Number <span className="text-slate-500 text-[10px]">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98200 00000"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1 font-public">
                      Password <span className="text-teal-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Role Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 font-public">
                    Select Assigned Operational Role <span className="text-teal-400">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ROLES_INFO.map((r) => {
                      const isSelected = role === r.id
                      const Icon = r.icon
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-teal-400 bg-teal-950/40 shadow-sm shadow-teal-500/20 ring-1 ring-teal-400'
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon size={16} className={isSelected ? 'text-teal-400' : 'text-slate-400'} />
                            <span className={`text-xs font-bold font-public ${isSelected ? 'text-teal-200' : 'text-slate-200'}`}>
                              {r.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">{r.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Role-specific Contextual Fields */}
                {role === 'Contractor' && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 animate-fadeIn">
                    <label className="block text-xs font-medium text-amber-400 font-public flex items-center gap-1.5">
                      <Building2 size={14} /> Assigned Active Site
                    </label>
                    <select
                      value={siteId}
                      onChange={(e) => setSiteId(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1.5 px-3 text-xs text-slate-100 focus:border-amber-500 focus:outline-none cursor-pointer"
                    >
                      <option value="SITE-001">SITE-001: Riverside Tower (Bandra, Mumbai)</option>
                      <option value="SITE-002">SITE-002: Warehouse Expansion (Bhiwandi, Thane)</option>
                      <option value="SITE-003">SITE-003: Metro Heights (Powai, Mumbai)</option>
                      <option value="SITE-004">SITE-004: Greenfield Commercial Complex (Pune)</option>
                    </select>
                  </div>
                )}

                {role === 'Project Manager' && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 animate-fadeIn">
                    <label className="block text-xs font-medium text-teal-400 font-public flex items-center gap-1.5">
                      <Briefcase size={14} /> Assigned Project Cluster
                    </label>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1.5 px-3 text-xs text-slate-100 focus:border-teal-500 focus:outline-none cursor-pointer"
                    >
                      <option value="1">Project Cluster 1 (Mumbai Metro Region - Sites 1, 2, 3)</option>
                      <option value="2">Project Cluster 2 (Pune Urban Sector - Site 4)</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-600/20 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer font-public mt-2"
                >
                  {loading ? 'Creating Account & Initializing...' : 'Create Account & Start Session'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>
            </>
          )}

          <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-teal-400 hover:text-teal-300">
              Sign in with existing credentials or use demo roles
            </Link>
          </div>
        </div>

        {/* Back to landing link */}
        <div className="text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 font-ibm">
            ← Back to marketing home
          </Link>
        </div>
      </div>
    </div>
  )
}
