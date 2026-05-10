import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type BadgeVariant = 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'slate'

interface BadgeProps {
    children: ReactNode
    variant?: BadgeVariant
    className?: string
    pulse?: boolean
}

const variantMap: Record<BadgeVariant, string> = {
    indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25 shadow-indigo-500/10',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 shadow-emerald-500/10',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/25 shadow-rose-500/10',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/25 shadow-amber-500/10',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25 shadow-cyan-500/10',
    slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export function Badge({ children, variant = 'slate', className, pulse = false }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border shadow-sm',
                variantMap[variant],
                className
            )}
        >
            {pulse && (
                <span className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    variant === 'rose' && 'bg-rose-400 animate-pulse',
                    variant === 'amber' && 'bg-amber-400 animate-pulse',
                    variant === 'emerald' && 'bg-emerald-400',
                    variant === 'indigo' && 'bg-indigo-400',
                    variant === 'cyan' && 'bg-cyan-400',
                    variant === 'slate' && 'bg-slate-400',
                )} />
            )}
            {children}
        </span>
    )
}
