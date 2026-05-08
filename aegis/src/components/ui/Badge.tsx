import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type BadgeVariant = 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'slate'

interface BadgeProps {
    children: ReactNode
    variant?: BadgeVariant
    className?: string
}

const variantMap: Record<BadgeVariant, string> = {
    indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    slate: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
}

export function Badge({ children, variant = 'slate', className }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
                variantMap[variant],
                className
            )}
        >
            {children}
        </span>
    )
}
