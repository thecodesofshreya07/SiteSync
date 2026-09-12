import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldAlert,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const ROLES_INFO = [
  {
    id: 'Project Manager',
    title: 'Project Manager',
    desc: 'Multi-site operational command, AI autonomous alerts, budget tracking & photo scan verifications.',
  },
  {
    id: 'Contractor',
    title: 'Contractor / Field Engineer',
    desc: 'On-ground field supervisor. Logs daily concrete & steel consumption, submits material PO requests.',
  },
  {
    id: 'Accountant',
    title: 'Accountant / Finance Manager',
    desc: 'Financial clearance, purchase order approvals, vendor invoice auditing, and budget limits.',
  },
  {
    id: 'Admin',
    title: 'Administrator',
    desc: 'Full administrative governance, system configuration, vendor catalogue and audit access.',
  },
]

export default function SignUp() {
  const { signup, register } = useAuth()
  const signupFn = signup || register
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Contractor')
  const [siteId, setSiteId] = useState('SITE-001')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) {
      setError('Please fill in all mandatory fields.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const payload = {
        name,
        email,
        phone,
        password,
        role,
        siteId: role === 'Contractor' ? siteId : undefined,
      }

      await signupFn(payload)
      setSuccess(true)

      // Auto login / redirect to workspace
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
    <div className="flex min-h-screen items-center justify-center bg-[#f4f9f6] px-4 py-10 sm:py-16 text-slate-900 font-public selection:bg-[#146b3a] selection:text-white">
      <div className="w-full max-w-2xl sm:max-w-3xl space-y-6 sm:space-y-8">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#146b3a] hover:border-emerald-300 transition-all shadow-sm font-public"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>

          <Link
            to="/login"
            className="text-xs sm:text-sm font-bold text-[#146b3a] hover:underline font-ibm"
          >
            Already registered? Sign In →
          </Link>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-white p-2.5 border border-slate-200/90 shadow-md hover:scale-105 transition-transform"
          >
            <img
              src="/sitesync_logo.png"
              alt="SiteSync Logo"
              className="h-full w-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </Link>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-public">
            Create Your Account
          </h1>
          <p className="text-xs sm:text-base text-slate-700 font-medium font-ibm max-w-lg mx-auto">
            Autonomous Multi-Site Construction Operations & Intelligence
          </p>
        </div>

        {/* SignUp Card - Larger, generous, and comfortable */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-xl space-y-6 font-ibm">
          {success ? (
            <div className="py-12 text-center space-y-3.5">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Check size={32} strokeWidth={3} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-public">Account Registered Successfully!</h3>
              <p className="text-xs sm:text-sm text-slate-700 font-medium">Storing in SiteSync database & launching workspace session...</p>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-public">User Registration</h2>
                <p className="text-xs sm:text-sm text-slate-700 font-medium mt-0.5">
                  Register a new account with your assigned operational site role.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 font-ibm">
                  <ShieldAlert size={18} className="shrink-0 text-red-500 mt-0.5" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 font-public">
                      Full Name <span className="text-[#146b3a]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs sm:text-sm text-slate-900 focus:border-[#146b3a] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 font-public">
                      Work Email <span className="text-[#146b3a]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs sm:text-sm text-slate-900 focus:border-[#146b3a] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 font-public">
                      Phone Number <span className="text-slate-500 text-xs font-medium">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs sm:text-sm text-slate-900 focus:border-[#146b3a] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 font-public">
                      Password <span className="text-[#146b3a]">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-xs sm:text-sm text-slate-900 focus:border-[#146b3a] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Role Selector */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2 font-public">
                    Select Assigned Operational Role <span className="text-[#146b3a]">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ROLES_INFO.map((r) => {
                      const isSelected = role === r.id
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#146b3a] bg-emerald-50/70 shadow-sm ring-2 ring-[#146b3a]'
                              : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-xs sm:text-sm font-bold font-public ${isSelected ? 'text-[#146b3a]' : 'text-slate-900'}`}>
                              {r.title}
                            </span>
                            {isSelected && <span className="h-2 w-2 rounded-full bg-[#146b3a]" />}
                          </div>
                          <p className="text-xs text-slate-700 font-medium leading-relaxed">{r.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Role-specific Contextual Fields (Only for Contractor) */}
                {role === 'Contractor' && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs sm:text-sm font-bold text-slate-800 font-public">
                      Assigned Active Site
                    </label>
                    <select
                      value={siteId}
                      onChange={(e) => setSiteId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-xs sm:text-sm text-slate-900 focus:border-[#146b3a] focus:outline-none cursor-pointer"
                    >
                      <option value="SITE-001">SITE-001: Riverside Tower (Bandra, Mumbai)</option>
                      <option value="SITE-002">SITE-002: Warehouse Expansion (Bhiwandi, Thane)</option>
                      <option value="SITE-003">SITE-003: Metro Heights (Powai, Mumbai)</option>
                      <option value="SITE-004">SITE-004: Greenfield Commercial Complex (Pune)</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#146b3a] hover:bg-[#188045] py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#146b3a]/20 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer font-public mt-3"
                >
                  {loading ? 'Creating Account & Initializing...' : 'Create Account & Start Session'}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            </>
          )}

          <div className="pt-3 text-center text-xs sm:text-sm text-slate-700 font-medium border-t border-slate-100">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#146b3a] hover:underline">
              Sign in with existing credentials or use demo roles
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
