import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, ShieldAlert, Cpu, Database, CheckCircle2, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    email: 'admin@sitesync.com',
    desc: 'Full access across all projects, sites & user management',
    badgeTone: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    role: 'Project Manager',
    email: 'pm@sitesync.com',
    desc: 'Assigned to PROJECT-001. PM validations & vendor recommendations',
    badgeTone: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  {
    role: 'Contractor',
    email: 'contractor@sitesync.com',
    desc: 'Restricted to SITE-002 (Warehouse Expansion). Material Requests',
    badgeTone: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    role: 'Finance',
    email: 'finance@sitesync.com',
    desc: 'Financial approvals, budget checking & payment status management',
    badgeTone: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in both Email and Password fields.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectDemoAccount = (demoEmail) => {
    setEmail(demoEmail)
    setPassword('password123')
    setError(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 text-slate-100 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20">
            <Cpu size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">SiteSync</h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">AI Construction Operations Platform</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-100">Sign In to Your Account</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials to receive a signed JWT session.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-950/50 p-3.5 text-xs text-red-300">
              <ShieldAlert size={16} className="shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@sitesync.com"
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-500 py-2.5 text-sm font-semibold text-slate-950 shadow-md hover:bg-teal-400 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        {/* Quick Demo Accounts */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Development Demo Accounts</span>
            <span className="text-2xs text-slate-500">Password: <code className="text-teal-400">password123</code></span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleSelectDemoAccount(acc.email)}
                className="flex items-start justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-left hover:border-teal-500/50 hover:bg-slate-900 transition-all cursor-pointer group"
              >
                <div className="space-y-0.5 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-2xs font-bold ${acc.badgeTone}`}>
                      {acc.role}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">{acc.email}</span>
                  </div>
                  <p className="text-2xs text-slate-400 truncate">{acc.desc}</p>
                </div>
                <CheckCircle2 size={16} className="text-slate-600 group-hover:text-teal-400 shrink-0 mt-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-3 text-2xs text-slate-500">
          <span className="flex items-center gap-1"><Database size={11} /> PostgreSQL Supabase</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Cpu size={11} /> JWT Authorization</span>
        </div>
      </div>
    </div>
  )
}
