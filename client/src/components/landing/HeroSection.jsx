import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react'

const HERO_HIGHLIGHTS = [
  {
    tag: 'Autonomous Multi-Site Command',
    title: 'PRECISION BUILT FOUNDATIONS THAT ENDURE.',
    subtitle: 'Autonomous multi-site resource command, material telemetry, and predictive procurement that eliminates delay risks before they stop the job.',
  },
  {
    tag: 'Predictive Procurement',
    title: 'ZERO-DELAY MATERIAL INTELLIGENCE.',
    subtitle: 'Live concrete and steel burn-rate forecasting with automated vendor lead-time rebalancing across all active projects.',
  },
  {
    tag: 'EVM Budget Governance',
    title: 'AUDIT-PROOF FINANCIAL INTEGRITY.',
    subtitle: 'Continuous Earned Value Management safeguards that stop unauthorized purchase orders before cashflow leakage occurs.',
  },
]

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_HIGHLIGHTS.length)
  }

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_HIGHLIGHTS.length) % HERO_HIGHLIGHTS.length)
  }

  const highlight = HERO_HIGHLIGHTS[currentSlide]

  return (
    <section
      id="home"
      className="relative w-full min-h-[calc(100vh-65px)] min-h-[600px] flex flex-col justify-between items-center text-slate-900 overflow-hidden bg-white px-4 sm:px-6 lg:px-8"
    >
      {/* Scenic Construction Vector Background (Full screen edge-to-edge) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Desktop Landscape Background */}
        <img
          src="/construction_vector_hero.jpg"
          alt="SiteSync Construction Landscape"
          className="hidden sm:block w-full h-full object-cover object-bottom brightness-[0.93] contrast-[1.06]"
        />
        {/* Mobile Vertical 9:16 Tailored Background */}
        <img
          src="/construction_vector_hero_mobile.jpg"
          alt="SiteSync Construction Landscape Mobile"
          className="block sm:hidden w-full h-full object-cover object-bottom brightness-[0.95] contrast-[1.05]"
        />
        {/* Balanced vertical gradient ensuring illustration is clearly visible while text stays razor-sharp */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/75 via-white/40 via-35% to-transparent" />
        {/* Smooth bottom transition fade matching #f4f9f6 */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#f4f9f6] via-[#f4f9f6]/70 via-40% to-transparent" />
      </div>

      {/* Floating Side Next Carousel Button (Only on wide screens) */}
      <button
        type="button"
        onClick={handleNext}
        aria-label="Next Highlight"
        className="hidden xl:flex absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 z-30 h-12 w-12 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-slate-200/80 items-center justify-center text-slate-700 hover:text-[#146b3a] hover:scale-105 active:scale-95 transition-all cursor-pointer"
      >
        <ChevronRight size={22} strokeWidth={2.5} />
      </button>

      {/* Floating Side Prev Carousel Button */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Previous Highlight"
        className="hidden xl:flex absolute left-6 lg:left-10 top-1/2 -translate-y-1/2 z-30 h-12 w-12 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-slate-200/80 items-center justify-center text-slate-700 hover:text-[#146b3a] hover:scale-105 active:scale-95 transition-all cursor-pointer"
      >
        <ChevronLeft size={22} strokeWidth={2.5} />
      </button>

      {/* Hero Header Content */}
      <div className="relative z-10 max-w-4xl w-full mx-auto text-center space-y-3 sm:space-y-4 pt-10 sm:pt-14 lg:pt-16">
        {/* Ambient soft glow directly behind text ensuring zero messiness and maximum legibility */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-64 bg-white/80 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Stylized Eyebrow */}
        <div className="flex items-center justify-center">
          <p className="font-script text-xl sm:text-3xl md:text-4xl text-[#146b3a] tracking-wide font-bold select-none">
            {highlight.tag}
          </p>
        </div>

        {/* Main Headline */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 font-public leading-[1.15] sm:leading-[1.12] transition-all duration-300 uppercase px-2">
          {highlight.title}
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-800 font-semibold font-public leading-relaxed max-w-2xl mx-auto px-2">
          {highlight.subtitle}
        </p>

        {/* Action Buttons */}
        <div className="pt-3 sm:pt-4 flex items-center justify-center">
          <Link
            to="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#146b3a] hover:bg-[#188045] px-8 sm:px-10 py-3.5 text-xs sm:text-sm md:text-base font-bold text-white shadow-lg shadow-[#146b3a]/25 transition-all active:scale-95 cursor-pointer"
          >
            <span>Build With Us</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Carousel Pagination Dots (Desktop / Tablet only) */}
        <div className="hidden sm:flex items-center justify-center gap-2 pt-2">
          {HERO_HIGHLIGHTS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === idx ? 'w-8 bg-[#146b3a]' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Spacer to reveal vector illustration seamlessly */}
      <div className="relative z-10 w-full h-32 sm:h-44 md:h-56 lg:h-64 pointer-events-none" />
    </section>
  )
}
