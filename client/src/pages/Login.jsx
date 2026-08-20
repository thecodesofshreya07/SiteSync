import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Mail, ShieldAlert, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

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
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 font-public">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white p-2 shadow-lg shadow-teal-500/10">
            <img
              src="/sitesync_logo.png"
              alt="SiteSync Logo"
              className="h-full w-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-public">Sign In to SiteSync</h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-400 font-ibm">
            Autonomous Multi-Site Construction Ops
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-7 shadow-2xl space-y-5 font-ibm backdrop-blur-md">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white font-public">Account Credentials</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your enterprise email and password to access your site workspace.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/60 p-3 text-xs text-red-300">
              <ShieldAlert size={16} className="shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 font-public">
                Work Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@sitesync.com"
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
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#146b3a] hover:bg-[#188045] py-2.5 text-sm font-bold text-white shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer font-public"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800">
            Don't have an account yet?{' '}
            <Link to="/signup" className="font-bold text-teal-400 hover:text-teal-300">
              Create an account
            </Link>
          </div>
        </div>

        {/* Back to landing */}
        <div className="text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 font-ibm">
            ← Back to marketing home
          </Link>
        </div>
      </div>
    </div>
  )
}
