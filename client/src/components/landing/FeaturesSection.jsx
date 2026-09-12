import { QrCode, Camera, ShieldAlert, Cpu, Layers, HardHat } from 'lucide-react'

export default function FeaturesSection() {
  const features = [
    {
      num: '01',
      icon: ShieldAlert,
      title: 'Autonomous Shortage Alerts',
      desc: 'Detects inventory dropouts below reorder thresholds and sends instant rich alerts to Project Managers via Brevo.',
      category: 'Real-Time',
      color: 'text-[#146b3a]',
      bg: 'bg-emerald-50 border-emerald-200',
    },
    {
      num: '02',
      icon: Cpu,
      title: 'AI Budget Overrun Guard',
      desc: 'Auto-rejects purchase orders that exceed site budget buffers, alerting the Finance Manager for override review.',
      category: 'Governance',
      color: 'text-teal-700',
      bg: 'bg-teal-50 border-teal-200',
    },
    {
      num: '03',
      icon: QrCode,
      title: '2D Material QR Tracking',
      desc: 'Generates print-ready thermal stickers and mobile-scannable 2D QR codes for zero-error field stock-in/out.',
      category: 'Field Operations',
      color: 'text-[#146b3a]',
      bg: 'bg-emerald-50 border-emerald-200',
    },
    {
      num: '04',
      icon: Camera,
      title: 'AI Photo Progress Forecasts',
      desc: 'Engineers upload site photos; Groq AI analyzes captions to forecast upcoming 3-day work plans in simple English.',
      category: 'Groq LLM',
      color: 'text-teal-700',
      bg: 'bg-teal-50 border-teal-200',
    },
    {
      num: '05',
      icon: Layers,
      title: 'Inter-Site Transfer Routing',
      desc: 'Matches critical shortages at one site with surplus inventory at sibling projects to avoid emergency procurement.',
      category: 'Logistics',
      color: 'text-[#146b3a]',
      bg: 'bg-emerald-50 border-emerald-200',
    },
    {
      num: '06',
      icon: HardHat,
      title: 'Multi-Role Security Scoping',
      desc: 'Strict role boundaries: Contractors see only assigned sites, Finance manages approvals, and PMs oversee all sites.',
      category: 'Enterprise Auth',
      color: 'text-teal-700',
      bg: 'bg-teal-50 border-teal-200',
    },
  ]

  return (
    <section id="features" className="py-20 sm:py-28 bg-gradient-to-b from-[#f4f9f6] via-white to-[#f4f9f6] text-slate-900 relative overflow-hidden">
      {/* Ambient background soft green aura for a seamless fluid transition */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-72 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-[#146b3a] border border-emerald-200 font-ibm">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 font-public tracking-tight">
            Engineered for Ground-Level Reliability
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 font-ibm leading-relaxed">
            Every feature in SiteSync is designed to solve real operational bottlenecks faced by general contractors and developers.
          </p>
        </div>

        {/* 6 Vibrant Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 mt-14 sm:mt-16">
          {features.map((f, idx) => {
            const Icon = f.icon
            return (
              <div
                key={idx}
                className="rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-7 space-y-4 hover:border-[#146b3a]/50 hover:bg-white hover:shadow-xl transition-all duration-300 shadow-sm group"
              >
                <div className="flex items-center justify-between">
                  <div className={`h-12 w-12 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon size={22} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-[#146b3a] font-ibm border border-emerald-200/80 shadow-xs">
                    {f.category}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  <h3 className="text-lg font-bold text-slate-900 font-public group-hover:text-[#146b3a] transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-ibm leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
