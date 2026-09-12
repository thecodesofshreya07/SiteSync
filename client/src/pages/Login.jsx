import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Lock,
  Mail,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Briefcase,
  HardHat,
  Receipt,
  Zap,
  KeyRound,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const DEMO_ROLES = [
  {
    id: 'admin',
    category: 'executive',
    role: 'Admin',
    name: 'Admin User',
    email: 'admin@sitesync.com',
    password: 'password123',
    icon: ShieldCheck,
    badgeText: 'Global Control',
    accentColor: 'border-purple-500/40 bg-purple-950/20 text-purple-400 hover:border-purple-400',
    btnColor: 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20',
    description: 'Full administrative access across all sites, user provisioning, autonomous AI agent oversight & system settings.',
    siteScope: 'Global (All 4 Sites)',
  },
  {
    id: 'pm',
    category: 'executive',
    role: 'Project Manager',
    name: 'Project Manager',
    email: 'mirlubaib51005@gmail.com',
    password: 'password123',
    icon: Briefcase,
    badgeText: 'Multi-Site AI & Budgets',
    accentColor: 'border-teal-500/40 bg-teal-950/20 text-teal-400 hover:border-teal-400',
    btnColor: 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/20',
    description: 'Multi-site operations command, proactive AI anomaly triage, budget variance forecasting, and photo progress scans.',
    siteScope: 'Project Cluster 1 (Sites 1, 2, 3)',
  },
  {
    id: 'finance',
    category: 'executive',
    role: 'Accountant',
    name: 'Finance Manager',
    email: 'shreyamishra22042007@gmail.com',
    password: 'password123',
    icon: Receipt,
    badgeText: 'Procurement & Approvals',
    accentColor: 'border-blue-500/40 bg-blue-950/20 text-blue-400 hover:border-blue-400',
    btnColor: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20',
    description: 'Financial clearance, purchase order audits, vendor quote comparison, invoice clearance, and budget threshold enforcement.',
    siteScope: 'Financial Auditing (Global)',
  },
  {
    id: 'contractor1',
    category: 'contractor',
    role: 'Contractor (Site 1)',
    name: 'Rohan Sharma',
    email: 'contractor1@sitesync.com',
    password: 'password123',
    icon: HardHat,
    badgeText: 'Site 1 Supervisor',
    accentColor: 'border-amber-500/40 bg-amber-950/20 text-amber-400 hover:border-amber-400',
    btnColor: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20',
    description: 'Site 1 supervisor (Riverside Tower, Bandra). Logs daily concrete/steel usage, creates restock requests, and uploads site scans.',
    siteScope: 'SITE-001: Riverside Tower (Bandra)',
  },
  {
    id: 'contractor2',
    category: 'contractor',
    role: 'Contractor (Site 2)',
    name: 'Vikram Singh',
    email: 'contractor@sitesync.com',
    password: 'password123',
    icon: HardHat,
    badgeText: 'Site 2 Supervisor',
    accentColor: 'border-orange-500/40 bg-orange-950/20 text-orange-400 hover:border-orange-400',
    btnColor: 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/20',
    description: 'Site 2 supervisor (Warehouse Expansion, Bhiwandi). Logs critical materials, manages delayed deliveries & subtasks.',
    siteScope: 'SITE-002: Warehouse Expansion (Bhiwandi)',
  },
  {
    id: 'contractor3',
    category: 'contractor',
    role: 'Contractor (Site 3)',
    name: 'Priya Joshi',
    email: 'contractor3@sitesync.com',
    password: 'password123',
    icon: HardHat,
    badgeText: 'Site 3 Supervisor',
    accentColor: 'border-yellow-500/40 bg-yellow-950/20 text-yellow-400 hover:border-yellow-400',
    btnColor: 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-600/20',
    description: 'Site 3 supervisor (Metro Heights, Powai). Oversees commercial high-rise foundation stocks and daily material logs.',
    siteScope: 'SITE-003: Metro Heights (Powai)',
  },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeQuickLoginId, setActiveQuickLoginId] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  const filteredRoles = DEMO_ROLES.filter((r) => {
    if (activeTab === 'contractors') return r.category === 'contractor'
    if (activeTab === 'executive') return r.category === 'executive'
    return true
  })

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in both Email and Password fields.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleInstantLogin = async (demoRole) => {
    setEmail(demoRole.email)
    setPassword(demoRole.password)
    setError(null)
    setActiveQuickLoginId(demoRole.id)

    try {
      await login(demoRole.email, demoRole.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || `Failed to login as ${demoRole.role}.`)
      setActiveQuickLoginId(null)
    }
  }

  const handleFillCredentials = (demoRole) => {
    setEmail(demoRole.email)
    setPassword(demoRole.password)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 sm:py-12 text-slate-100 font-public selection:bg-teal-500 selection:text-white flex flex-col justify-center items-center">
      <div className="w-full max-w-6xl space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white p-2 shadow-lg shadow-teal-500/10 hover:scale-105 transition-transform"
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
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-public">
            Welcome to SiteSync
          </h1>
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-teal-400 font-ibm">
            Autonomous Multi-Site Construction Operations & Intelligence
          </p>
        </div>

        {/* Simulation Notice Banner */}
        <div className="rounded-2xl border border-teal-500/30 bg-teal-950/20 p-4 sm:p-5 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-public">
                  Interactive Simulation Mode Active
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-ibm">
                  All 3 Site Contractors & Management Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                SiteSync simulates a live enterprise construction network. Choose any of the <span className="text-amber-300 font-semibold">3 Site Supervisors</span> or <span className="text-teal-300 font-semibold">Management Personas</span> below for instant 1-click login to test site-specific data isolation and permissions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <span className="text-[11px] font-semibold text-teal-400 bg-teal-950/60 border border-teal-800/40 px-3 py-1 rounded-full font-ibm flex items-center gap-1.5">
              <Zap size={13} /> 1-Click Role Login Ready
            </span>
          </div>
        </div>

        {/* Main Grid: Demo Roles on Left/Center + Manual Sign-In Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Demo Roles Section (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-base font-bold text-white font-public flex items-center gap-2">
                <KeyRound size={16} className="text-teal-400" />
                Select a Role for Instant 1-Click Login
              </h2>

              {/* Category Filter Tabs */}
              <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-ibm">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'all' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All (6)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('contractors')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'contractors' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Contractors (3)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('executive')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'executive' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Exec & Finance (3)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredRoles.map((demo) => {
                const Icon = demo.icon
                const isLoggingIn = activeQuickLoginId === demo.id

                return (
                  <div
                    key={demo.id}
                    onClick={() => handleFillCredentials(demo)}
                    className={`group relative rounded-2xl border p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      email === demo.email
                        ? 'border-teal-400 bg-slate-900/90 shadow-lg shadow-teal-500/10 ring-1 ring-teal-400'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${demo.accentColor}`}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white font-public group-hover:text-teal-300 transition-colors">
                              {demo.role}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-ibm">{demo.name}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-ibm whitespace-nowrap">
                          {demo.badgeText}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-300 font-ibm leading-relaxed mb-3">
                        {demo.description}
                      </p>

                      {/* Credentials Strip */}
                      <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 mb-3 space-y-1 font-mono text-[11px]">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-500">Email:</span>
                          <span className="font-semibold text-slate-200 truncate ml-2">{demo.email}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-500">Scope:</span>
                          <span className="text-slate-400 text-[10px] truncate ml-1">{demo.siteScope}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      disabled={loading || isLoggingIn}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleInstantLogin(demo)
                      }}
                      className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-[0.98] cursor-pointer font-public ${demo.btnColor} disabled:opacity-50`}
                    >
                      {isLoggingIn ? (
                        <>Authenticating session...</>
                      ) : (
                        <>
                          <Zap size={14} className="fill-current" />
                          Login as {demo.name.split(' ')[0]} ⚡
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Manual Login Card (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white font-public flex items-center gap-2">
                <Lock size={16} className="text-teal-400" />
                Sign In With Credentials
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-7 shadow-2xl space-y-5 font-ibm backdrop-blur-md">
              <div className="border-b border-slate-800 pb-3">
                <p className="text-xs text-slate-400">
                  Enter your credentials manually or choose from any simulated role on the left.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/60 p-3 text-xs text-red-300">
                  <ShieldAlert size={16} className="shrink-0 text-red-400 mt-0.5" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 font-public">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. admin@sitesync.com"
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 font-public">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !!activeQuickLoginId}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-600/20 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer font-public"
                >
                  {loading && !activeQuickLoginId ? 'Authenticating...' : 'Sign In to Workspace'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>

              <div className="pt-3 text-center text-xs text-slate-400 border-t border-slate-800 space-y-1">
                <div>
                  Don't have an account yet?{' '}
                  <Link to="/signup" className="font-bold text-teal-400 hover:text-teal-300">
                    Create a new account
                  </Link>
                </div>
                <p className="text-[11px] text-slate-500">
                  New users will be saved to the PostgreSQL database with custom role privileges.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to landing */}
        <div className="text-center pt-2">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 font-ibm">
            ← Back to marketing home
          </Link>
        </div>
      </div>
    </div>
  )
}
