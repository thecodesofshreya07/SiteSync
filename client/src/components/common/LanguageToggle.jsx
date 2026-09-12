import { Languages } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

/**
 * LanguageToggle Component
 * Pill switch to toggle full-page translation between English and Hindi.
 * Styled in SiteSync brand emerald green.
 */
export default function LanguageToggle({ variant = 'light', className = '' }) {
  const { toggleLanguage, isHindi } = useLanguage()

  const isDark = variant === 'dark'

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={isHindi ? 'Switch to English' : 'हिन्दी में अनुवाद करें (Switch to Hindi)'}
      aria-label="Toggle language between English and Hindi"
      className={`relative inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer shadow-2xs select-none ${
        isDark
          ? 'border border-white/20 bg-slate-900/60 text-white hover:bg-slate-800/80 backdrop-blur-md'
          : isHindi
          ? 'border border-emerald-300 bg-emerald-50/70 text-[#146b3a] hover:bg-emerald-100/70'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
      } ${className}`}
    >
      <Languages size={15} className={isHindi ? 'text-[#146b3a]' : 'text-slate-500'} />

      {/* Sliding Pill Indicator */}
      <div
        className={`flex items-center gap-1 rounded-lg p-0.5 text-2xs font-bold transition-all ${
          isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-100/90 text-slate-600'
        }`}
      >
        <span
          className={`rounded-md px-1.5 py-0.5 transition-all ${
            !isHindi
              ? isDark
                ? 'bg-white/20 text-white shadow-xs'
                : 'bg-white text-[#146b3a] shadow-xs font-bold'
              : 'opacity-60 text-slate-500'
          }`}
        >
          EN
        </span>
        <span
          className={`rounded-md px-1.5 py-0.5 transition-all ${
            isHindi
              ? 'bg-[#146b3a] text-white shadow-xs font-bold'
              : 'opacity-60 text-slate-500 font-medium'
          }`}
        >
          हिं
        </span>
      </div>
    </button>
  )
}
