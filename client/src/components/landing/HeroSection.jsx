import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-screen w-full flex items-center justify-start bg-slate-950 text-white overflow-hidden"
    >
      {/* Background Image: Full-bleed construction scene with CAT excavator */}
      <div className="absolute inset-0 z-0">
        <img
          src="/construction_hero.jpg"
          alt="Precision Built Construction Site"
          className="h-full w-full object-cover object-center"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?auto=format&fit=crop&w=2000&q=80'
          }}
        />
        {/* Left Dark Vignette / Shadow Overlay to make white text pop */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />
      </div>

      {/* Hero Content on the Left */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 w-full pt-28 pb-16">
        <div className="max-w-2xl space-y-6">
          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black uppercase tracking-tight text-white font-public leading-[1.1]">
            PRECISION BUILT <br />
            FOUNDATIONS THAT <br />
            <span className="text-[#64b5f6]">ENDURE.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-200 font-medium font-public leading-relaxed max-w-xl">
            Autonomous multi-site resource command, material telemetry, and predictive procurement that eliminates delay risks before they stop the job.
          </p>

          {/* CTA Button */}
          <div className="pt-2">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-[#146b3a] hover:bg-[#188045] px-6 py-3.5 text-sm sm:text-base font-bold text-white shadow-xl transition-all active:scale-[0.98]"
            >
              <span>Build With Us</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
