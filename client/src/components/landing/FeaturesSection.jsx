import { QrCode, Camera, ShieldAlert, Cpu, Layers, HardHat, Mail, FileText, CheckCircle } from 'lucide-react'

export default function FeaturesSection() {
  const features = [
    {
      icon: ShieldAlert,
      title: 'Autonomous Shortage Alerts',
      desc: 'Detects inventory dropouts below reorder thresholds and sends instant rich alerts to Project Managers via Brevo.',
      tag: 'Real-Time',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    {
      icon: Cpu,
      title: 'AI Budget Overrun Guard',
      desc: 'Auto-rejects purchase orders that exceed site budget buffers, alerting the Finance Manager for override review.',
      tag: 'Governance',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      icon: QrCode,
      title: '2D Material QR Tracking',
      desc: 'Generates print-ready thermal stickers and mobile-scannable 2D QR codes for zero-error field stock-in/out.',
      tag: 'Field Operations',
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
    },
    {
      icon: Camera,
      title: 'AI Photo Progress Forecasts',
      desc: 'Engineers upload site photos; Groq AI analyzes captions to forecast upcoming 3-day work plans in simple English.',
      tag: 'Groq LLM',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: Layers,
      title: 'Inter-Site Transfer Routing',
      desc: 'Matches critical shortages at one site with surplus inventory at sibling projects to avoid emergency procurement.',
      tag: 'Logistics',
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
    },
    {
      icon: HardHat,
      title: 'Multi-Role Security Scoping',
      desc: 'Strict role boundaries: Contractors see only assigned sites, Finance manages approvals, and PMs oversee all sites.',
      tag: 'Enterprise Auth',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
  ]

  return (
    <section id="features" className="py-24 bg-slate-950 text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-teal-400 font-ibm">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-public tracking-tight">
            Engineered for Ground-Level Reliability
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-ibm">
            Every feature in SiteSync is designed to solve real operational bottlenecks faced by general contractors and developers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          {features.map((f, idx) => {
            const Icon = f.icon
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3.5 hover:border-slate-700 hover:bg-slate-900 transition-all shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className={`h-11 w-11 rounded-xl ${f.bg} ${f.color} flex items-center justify-center border border-white/5`}>
                    <Icon size={22} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-slate-400 font-ibm border border-white/5">
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white font-public group-hover:text-teal-400 transition-colors">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-400 font-ibm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
