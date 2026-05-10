import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CardProps {
    children: ReactNode
    className?: string
    hover?: boolean
    glow?: 'indigo' | 'rose' | 'amber' | 'emerald' | 'cyan'
}

const glowMap = {
    indigo: 'hover:shadow-indigo-500/10 hover:border-indigo-500/30',
    rose: 'hover:shadow-rose-500/10 hover:border-rose-500/30',
    amber: 'hover:shadow-amber-500/10 hover:border-amber-500/30',
    emerald: 'hover:shadow-emerald-500/10 hover:border-emerald-500/30',
    cyan: 'hover:shadow-cyan-500/10 hover:border-cyan-500/30',
}

export function Card({ children, className, hover = false, glow }: CardProps) {
    return (
        <div
            className={cn(
                'bg-[#16161f] border border-[#2a2a3a] rounded-xl',
                hover && 'hover:border-[#3a3a4a] hover:bg-[#1a1a26] transition-all duration-200 cursor-pointer stat-card-hover',
                glow && [
                    'transition-all duration-200 hover:shadow-lg',
                    glowMap[glow],
                ],
                className
            )}
        >
            {children}
        </div>
    )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('px-5 py-4 border-b border-[#2a2a3a]', className)}>
            {children}
        </div>
    )
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('px-5 py-4', className)}>{children}</div>
}
