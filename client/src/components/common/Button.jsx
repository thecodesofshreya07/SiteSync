import { cn } from '../../lib/utils'

const VARIANTS = {
  primary: 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm',
  secondary: 'bg-white text-navy-800 border border-surface-border hover:bg-surface-bg',
  ghost: 'text-navy-700 hover:bg-navy-900/5',
  danger: 'bg-white text-red-600 border border-red-100 hover:bg-red-50',
  success: 'bg-green-600 text-white hover:bg-green-700',
  warning: 'bg-white text-amber-600 border border-amber-100 hover:bg-amber-50',
}

const SIZES = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
  lg: 'px-4 py-2.5 text-sm',
}

export default function Button({
  children,
  variant = 'secondary',
  size = 'md',
  className,
  icon: Icon,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant] || VARIANTS.secondary,
        SIZES[size] || SIZES.md,
        className
      )}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2.25} />}
      {children}
    </button>
  )
}
