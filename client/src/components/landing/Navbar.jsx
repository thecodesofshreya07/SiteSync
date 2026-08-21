import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react'
import LanguageToggle from '../common/LanguageToggle'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-4 sm:top-5 left-0 right-0 z-50 px-3 sm:px-8 font-public">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-slate-950/45 px-4 sm:px-5 py-2.5 sm:py-3 backdrop-blur-md shadow-2xl">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white p-1 shadow-sm shrink-0">
              <img
                src="/sitesync_logo.png"
                alt="SiteSync Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white font-public">
              SiteSync
            </span>
          </Link>

          {/* Center Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-200 font-public">
            <a
              href="#home"
              className="relative py-1 text-white transition-colors"
            >
              Home
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-cyan-400" />
            </a>
            <a href="#about" className="text-slate-300 hover:text-white transition-colors">
              About Us
            </a>
            <a href="#features" className="text-slate-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#contact" className="text-slate-300 hover:text-white transition-colors">
              Contact Us
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5 sm:gap-3 font-public">
            <LanguageToggle variant="dark" />
            <Link
              to="/login"
              className="rounded-xl border border-white/20 bg-slate-800/40 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-white/10 transition-all backdrop-blur-xs"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#146b3a] hover:bg-[#188045] px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98]"
            >
              <span>Sign Up</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageToggle variant="dark" />
            <Link
              to="/login"
              className="sm:hidden rounded-lg border border-white/20 bg-slate-800/40 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Login
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 rounded-2xl border border-white/15 bg-slate-950/90 p-4 backdrop-blur-xl shadow-2xl space-y-3 font-public animate-fade-in-up">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-200">
              <a
                href="#home"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-white bg-white/5"
              >
                Home
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white"
              >
                About Us
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white"
              >
                Features
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white"
              >
                Contact Us
              </a>
            </nav>

            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#146b3a] py-2.5 text-xs font-bold text-white shadow-md"
              >
                <span>Sign Up</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
