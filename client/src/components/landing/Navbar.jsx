import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react'
import LanguageToggle from '../common/LanguageToggle'

const NAV_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'contact', label: 'Contact Us' },
]

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180 // offset for navbar height
      const sectionIds = ['home', 'about', 'contact']

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const element = document.getElementById(sectionIds[i])
        if (element) {
          const top = element.offsetTop
          if (scrollPosition >= top) {
            setActiveSection(sectionIds[i])
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // run once on mount
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 px-3.5 sm:px-8 py-3 sm:py-4 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3.5 shrink-0 group">
          <div className="flex h-9 w-9 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-white p-1 border border-slate-200/90 shadow-sm group-hover:scale-105 transition-transform shrink-0">
            <img
              src="/sitesync_logo.png"
              alt="SiteSync Logo"
              className="h-full w-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
          <span className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 font-public">
            <span className="text-[#146b3a]">Site</span>Sync
          </span>
        </Link>

        {/* Center Nav Links with Dynamic Active Indicator (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold font-public">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.id
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`relative py-1 transition-colors ${
                  isActive
                    ? 'text-slate-900 font-bold'
                    : 'text-slate-700 hover:text-[#146b3a]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-[#146b3a] transition-all duration-300" />
                )}
              </a>
            )
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden sm:flex items-center gap-3 font-public">
          <LanguageToggle variant="light" />
          <Link
            to="/login"
            className="rounded-full border border-slate-300 bg-white hover:bg-slate-50 px-5 py-2 text-xs sm:text-sm font-bold text-slate-800 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#146b3a] hover:bg-[#188045] px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#146b3a]/20 transition-all active:scale-95 cursor-pointer"
          >
            <span>Sign Up</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-1.5 sm:gap-2 shrink-0">
          <LanguageToggle variant="light" />
          <Link
            to="/login"
            className="sm:hidden rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-bold text-slate-800 bg-white shadow-sm"
          >
            Login
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1 text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu with Active Section Highlights */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl space-y-3 font-public animate-fade-in-up">
          <nav className="flex flex-col space-y-1.5 text-sm font-semibold">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.id
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-xl px-3.5 py-2.5 transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-emerald-50 text-[#146b3a] font-bold border border-emerald-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-[#146b3a]" />}
                </a>
              )
            })}
          </nav>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 rounded-full bg-[#146b3a] hover:bg-[#188045] py-2.5 text-xs font-bold text-white shadow-md shadow-[#146b3a]/20"
            >
              <span>Sign Up</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
