import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  UserPlus,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const DEMO_ROLES = [
  {
    id: 'pm',
    category: 'management',
    role: 'Project Manager',
    email: 'mirlubaib51005@gmail.com',
    password: 'password123',
    scopeBadge: 'Multi-Site Operations',
    scopeDesc: 'Oversees multiple active sites, validates material requisitions, and tracks milestone progress across projects.',
    accentColor: 'bg-emerald-50 text-[#146b3a] border-emerald-200',
    btnClass: 'bg-[#146b3a] hover:bg-[#188045] text-white shadow-emerald-900/10',
  },
  {
    id: 'finance',
    category: 'management',
    role: 'Finance Manager',
    email: 'shreyamishra22042007@gmail.com',
    password: 'password123',
    scopeBadge: 'Budget & POs',
    scopeDesc: 'Reviews financial allocations, approves high-value requisitions, and dispatches official vendor purchase orders.',
    accentColor: 'bg-teal-50 text-teal-700 border-teal-200',
    btnClass: 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-900/10',
  },
  {
    id: 'admin',
    category: 'management',
    role: 'System Administrator',
    email: 'admin@sitesync.com',
    password: 'password123',
    scopeBadge: 'Global Access',
    scopeDesc: 'System governance, user provisioning, security policies, and enterprise master configuration settings.',
    accentColor: 'bg-emerald-50 text-[#146b3a] border-emerald-200',
    btnClass: 'bg-[#146b3a] hover:bg-[#188045] text-white shadow-emerald-900/10',
  },
  {
    id: 'contractor1',
    category: 'site',
    role: 'Contractor (Site 1)',
    email: 'contractor1@sitesync.com',
    password: 'password123',
    scopeBadge: 'Riverside Tower (Bandra)',
    scopeDesc: 'Manages on-ground inventory, logs daily work milestones, and creates material purchase requisitions.',
    accentColor: 'bg-emerald-50 text-[#146b3a] border-emerald-200',
    btnClass: 'bg-[#146b3a] hover:bg-[#188045] text-white shadow-emerald-900/10',
  },
  {
    id: 'contractor2',
    category: 'site',
    role: 'Contractor (Site 2)',
    email: 'contractor@sitesync.com',
    password: 'password123',
    scopeBadge: 'Warehouse Exp. (Bhiwandi)',
    scopeDesc: 'Isolated Site 2 access: updates stock levels, uploads photo progress scans, and submits indents.',
    accentColor: 'bg-teal-50 text-teal-700 border-teal-200',
    btnClass: 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-900/10',
  },
  {
    id: 'contractor3',
    category: 'site',
    role: 'Contractor (Site 3)',
    email: 'contractor3@sitesync.com',
    password: 'password123',
    scopeBadge: 'Metro Heights (Powai)',
    scopeDesc: 'Isolated Site 3 access: handles on-ground material receipts, inspection logs, and daily site reports.',
    accentColor: 'bg-emerald-50 text-[#146b3a] border-emerald-200',
    btnClass: 'bg-[#146b3a] hover:bg-[#188045] text-white shadow-emerald-900/10',
  },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [loadingId, setLoadingId] = useState(null)
  const [error, setError] = useState(null)
  const [roleCategory, setRoleCategory] = useState('all')

  const visibleRoles = DEMO_ROLES.filter((r) => {
    if (roleCategory === 'management') return r.category === 'management'
    if (roleCategory === 'site') return r.category === 'site'
    return true
  })

  const handleDirectLogin = async (roleObj) => {
    setError(null)
    setLoadingId(roleObj.id)

    try {
      await login(roleObj.email, roleObj.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || `Failed to sign in as ${roleObj.role}.`)
      setLoadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f9f6] px-4 py-8 sm:py-14 text-slate-900 font-public selection:bg-[#146b3a] selection:text-white flex flex-col justify-center items-center">
      <div className="w-full max-w-6xl space-y-6 sm:space-y-8">
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
            to="/signup"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-bold text-[#146b3a] hover:bg-emerald-100/70 transition-all shadow-sm font-public"
          >
            <UserPlus size={16} />
            <span>Register Custom Account</span>
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
            Welcome to <span className="text-[#146b3a]">Site</span>Sync
          </h1>
          <p className="text-xs sm:text-base text-slate-700 font-medium font-ibm max-w-xl mx-auto">
            Select an operational role below for direct workspace access.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 font-ibm max-w-xl mx-auto shadow-sm">
            <ShieldAlert size={18} className="shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Filter Controls Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pt-1">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#146b3a]" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 font-public">
              Choose Workspace Persona
            </h2>
          </div>

          <div className="inline-flex rounded-2xl bg-white p-1 border border-slate-200 text-xs sm:text-sm font-ibm shadow-xs shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setRoleCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl transition-all font-semibold cursor-pointer ${
                roleCategory === 'all'
                  ? 'bg-[#146b3a] text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-[#146b3a]'
              }`}
            >
              All Roles (6)
            </button>
            <button
              type="button"
              onClick={() => setRoleCategory('management')}
              className={`px-3.5 py-1.5 rounded-xl transition-all font-semibold cursor-pointer ${
                roleCategory === 'management'
                  ? 'bg-[#146b3a] text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-[#146b3a]'
              }`}
            >
              Executive & Management
            </button>
            <button
              type="button"
              onClick={() => setRoleCategory('site')}
              className={`px-3.5 py-1.5 rounded-xl transition-all font-semibold cursor-pointer ${
                roleCategory === 'site'
                  ? 'bg-[#146b3a] text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-[#146b3a]'
              }`}
            >
              Site Contractors
            </button>
          </div>
        </div>

        {/* Role Cards Grid - Generous, responsive, and comfortable sizing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {visibleRoles.map((r) => {
            const isLoggingIn = loadingId === r.id
            const isAnyLoading = loadingId !== null

            return (
              <div
                key={r.id}
                className={`group rounded-3xl border transition-all p-5 sm:p-6 flex flex-col justify-between bg-white relative ${
                  isLoggingIn
                    ? 'border-[#146b3a] ring-2 ring-[#146b3a]/30 shadow-md'
                    : 'border-slate-200/90 hover:border-emerald-300 hover:shadow-lg'
                }`}
              >
                <div>
                  {/* Top Role Header */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 font-public group-hover:text-[#146b3a] transition-colors leading-snug">
                      {r.role}
                    </h3>

                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-ibm border border-slate-200 shrink-0">
                      {r.scopeBadge}
                    </span>
                  </div>

                  {/* Role Description */}
                  <p className="text-xs sm:text-[13px] text-slate-700 font-medium font-ibm mb-5 leading-relaxed">
                    {r.scopeDesc}
                  </p>
                </div>

                {/* Direct Login Action Button */}
                <button
                  type="button"
                  disabled={isAnyLoading}
                  onClick={() => handleDirectLogin(r)}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-[0.98] font-public ${
                    isLoggingIn
                      ? 'bg-[#146b3a] text-white opacity-90 cursor-wait'
                      : isAnyLoading
                      ? `${r.btnClass} cursor-not-allowed opacity-80`
                      : `${r.btnClass} cursor-pointer`
                  }`}
                >
                  {isLoggingIn ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Signing in as {r.role}...</span>
                    </>
                  ) : (
                    <>
                      <span>Login</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
