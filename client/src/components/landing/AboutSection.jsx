export default function AboutSection() {
  const capabilities = [
    {
      category: 'Autonomous Agentic Core',
      title: 'Autonomous 30s Telemetry & Live SSE Streaming',
      desc: 'Background AI agents autonomously audit the database every 30 seconds, streaming live updates via Server-Sent Events (SSE) for stock transfers, labor tracking, equipment status, and proactive budget drift investigations.',
    },
    {
      category: 'Financial Intelligence',
      title: 'CPI-Driven Predictive Budget & Category Control',
      desc: 'Calculates live Cost Performance Index (CPI) to forecast future milestone evacuation and cashflow runways, delivering granular category-level cost breakdowns with automated purchase order gating.',
    },
    {
      category: 'Multi-Agent Network',
      title: 'Autonomous Multi-Site Cross-Project Synchronization',
      desc: 'Decentralized multi-agent architecture continuously synchronizes operations across Site A, Site B, and Site C, coordinating inter-site material transfers, shared machinery, and unified progress milestones.',
    },
    {
      category: 'Supply Chain Intelligence',
      title: 'Predictive Procurement & Burn-Rate Reordering',
      desc: 'Monitors daily material consumption curves and remaining runway days to generate precise restock recommendations, automatically notifying Project Managers via Brevo email alerts before stockouts occur.',
    },
    {
      category: 'Procurement Governance',
      title: 'AI Vendor Intelligence & SLA Reliability Scoring',
      desc: 'Autonomous algorithms evaluate historical supplier fulfillment and delivery promises to calculate real-time vendor reliability grades, ensuring maximum accountability across procurement lifecycles.',
    },
    {
      category: 'Field Logistics & Vision',
      title: '2D Thermal QR Tracking & 72-Hour AI Lookahead',
      desc: 'Print-ready thermal QR stickers enable millisecond mobile stock-in/out logging, while computer vision turns site progress photos into predictive 3-day (72-hour) lookahead work plans and dependency schedules.',
    },
  ]

  return (
    <section
      id="about"
      className="py-20 sm:py-28 bg-gradient-to-b from-[#f4f9f6] via-[#f1f8f4] to-[#edf6f1] text-slate-900 relative overflow-hidden"
    >
      {/* Ambient background soft green aura for a seamless fluid transition */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-72 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 font-public tracking-tight">
            Built for High-Stakes Multi-Site Construction
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-700 font-medium font-ibm leading-relaxed">
            Eliminating fragmentation between job-site supervisors, project managers, and finance teams through unified real-time operational intelligence.
          </p>
        </div>

        {/* 6 Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 mt-14 sm:mt-16">
          {capabilities.map((c, idx) => {
            return (
              <div
                key={idx}
                className="relative rounded-2xl border border-slate-200/90 bg-white/95 p-6 sm:p-7 space-y-3.5 hover:border-[#146b3a]/50 hover:bg-white hover:shadow-xl transition-all duration-300 shadow-sm group flex flex-col justify-between"
              >
                {/* Subtle top accent bar */}
                <div className="absolute top-0 inset-x-6 h-[2px] bg-gradient-to-r from-transparent via-[#146b3a]/30 to-transparent group-hover:via-[#146b3a] transition-all duration-300" />

                <div className="space-y-2.5">
                  <div className="pt-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#146b3a] font-ibm">
                      {c.category}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-public group-hover:text-[#146b3a] transition-colors leading-snug">
                    {c.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 font-medium font-ibm leading-relaxed">
                    {c.desc}
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
