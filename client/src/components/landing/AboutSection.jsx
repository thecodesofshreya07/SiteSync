import { Building2, TrendingUp, Users, CheckCircle2, Shield, Clock } from 'lucide-react'

export default function AboutSection() {
  return (
    <section id="about" className="py-24 bg-slate-900 text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-teal-400 font-ibm">
            About SiteSync Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-public tracking-tight">
            Built for High-Stakes Multi-Site Construction
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-ibm">
            Traditional construction management suffers from data silos between site supervisors, project managers, and finance teams. SiteSync brings everyone onto one connected operational intelligence ledger.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-7 space-y-4 hover:border-teal-500/40 transition-colors shadow-lg">
            <div className="h-12 w-12 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
              <Building2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white font-public">Multi-Site Synchronization</h3>
            <p className="text-xs text-slate-400 font-ibm leading-relaxed">
              Track materials, workforce, equipment, and milestones across all your commercial, residential, and industrial sites from a single unified pane of glass.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 font-ibm pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-teal-400" />
                <span>Automated inter-site inventory re-balancing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-teal-400" />
                <span>Site-scoped contractor access control</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-7 space-y-4 hover:border-amber-500/40 transition-colors shadow-lg">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-lg font-bold text-white font-public">Predictive Budget & Procurement</h3>
            <p className="text-xs text-slate-400 font-ibm leading-relaxed">
              Autonomous AI algorithms continuously calculate material burn rates, vendor lead times, and cashflow runways, auto-rejecting budget-busting purchase orders.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 font-ibm pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-400" />
                <span>Earned Value Management (EVM) variance</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-400" />
                <span>Finance Manager executive override loop</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-7 space-y-4 hover:border-orange-500/40 transition-colors shadow-lg">
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <h3 className="text-lg font-bold text-white font-public">Connected Field Telemetry</h3>
            <p className="text-xs text-slate-400 font-ibm leading-relaxed">
              Site contractors scan 2D QR inventory labels and capture job site progress photos. Groq AI generates clear 72-hour work plans in simple English.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 font-ibm pt-2 border-t border-slate-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-orange-400" />
                <span>Scannable 2D QR material labels</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-orange-400" />
                <span>Instant Brevo transactional email alerts</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
