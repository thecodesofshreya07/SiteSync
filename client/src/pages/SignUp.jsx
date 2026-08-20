import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Mail, User, Building2, ArrowRight, Check } from 'lucide-react'

export default function SignUp() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Project Manager')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    }, 800)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 py-12 text-slate-100 font-public">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-500/20">
            <Building2 size={26} strokeWidth={2.4} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Create SiteSync Account</h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-400 font-ibm">Join Autonomous Construction Ops</p>
        </div>

        {/* SignUp Card */}
        <div className="rounded-2xl border border-slate-800 bg-navy-900/90 p-6 sm:p-7 shadow-2xl space-y-5 font-ibm">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <Check size={24} strokeWidth={3} />
              </div>
              <h3 className="text-lg font-bold text-white font-public">Account Created Successfully!</h3>
              <p className="text-xs text-slate-400">Redirecting to login with your credentials...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rohit Sharma"
                    className="w-full rounded-xl border border-slate-700 bg-navy-950 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Work Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rohit@constructions.com"
                    className="w-full rounded-xl border border-slate-700 bg-navy-950 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Operational Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-navy-950 py-2 px-3 text-sm text-slate-100 focus:border-teal-500 focus:outline-none cursor-pointer"
                >
                  <option value="Project Manager">Project Manager (Multi-site scope)</option>
                  <option value="Contractor">Contractor (Site specific)</option>
                  <option value="Accountant">Accountant (Financial approvals)</option>
                  <option value="Admin">Administrator (Global access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-slate-700 bg-navy-950 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-500 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer font-public"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}

          <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-teal-400 hover:text-teal-300">
              Sign in here
            </Link>
          </div>
        </div>

        {/* Back to landing link */}
        <div className="text-center">
          <Link to="/welcome" className="text-xs text-slate-500 hover:text-slate-300 font-ibm">
            ← Back to marketing home
          </Link>
        </div>
      </div>
    </div>
  )
}
