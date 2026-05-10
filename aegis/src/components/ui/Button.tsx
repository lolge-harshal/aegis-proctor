import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    loading?: boolean
    icon?: ReactNode
    children?: ReactNode
}

const variantMap: Record<ButtonVariant, string> = {
    primary:
        'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white border-transparent shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/35 hover:-translate-y-px',
    secondary:
        'bg-[#1c1c28] hover:bg-[#22222f] active:bg-[#1a1a24] text-slate-200 border-[#2a2a3a] hover:border-[#3d3d52]',
    ghost:
        'bg-transparent hover:bg-[#1c1c28] active:bg-[#161620] text-slate-400 hover:text-slate-200 border-transparent',
    danger:
        'bg-rose-600/15 hover:bg-rose-600/25 active:bg-rose-600/30 text-rose-400 border-rose-500/20 hover:border-rose-500/40',
}

const sizeMap: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
}

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    children,
    className,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            disabled={disabled || loading}
            className={cn(
                'inline-flex items-center justify-center font-medium rounded-lg border',
                'transition-all duration-150 ease-out',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0f]',
                variantMap[variant],
                sizeMap[size],
                className
            )}
            {...props}
        >
            {loading ? (
                <Loader2 size={14} className="animate-spin" />
            ) : icon}
            {children}
        </button>
    )
}
