import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatCardProps {
    label: string
    value: string | number
    icon: ReactNode
    trend?: { value: number; label: string }
    accent?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan'
    index?: number
}

const accentMap = {
    indigo: { icon: 'bg-indigo-500/10 text-indigo-400', border: 'hover:border-indigo-500/25', shadow: 'hover:shadow-indigo-500/8' },
    emerald: { icon: 'bg-emerald-500/10 text-emerald-400', border: 'hover:border-emerald-500/25', shadow: 'hover:shadow-emerald-500/8' },
    rose: { icon: 'bg-rose-500/10 text-rose-400', border: 'hover:border-rose-500/25', shadow: 'hover:shadow-rose-500/8' },
    amber: { icon: 'bg-amber-500/10 text-amber-400', border: 'hover:border-amber-500/25', shadow: 'hover:shadow-amber-500/8' },
    cyan: { icon: 'bg-cyan-500/10 text-cyan-400', border: 'hover:border-cyan-500/25', shadow: 'hover:shadow-cyan-500/8' },
}

export function StatCard({ label, value, icon, trend, accent = 'indigo', index = 0 }: StatCardProps) {
    const colors = accentMap[accent]

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
        >
            <div className={cn(
                'bg-[#16161f] border border-[#2a2a3a] rounded-xl px-5 py-4',
                'flex items-start justify-between gap-4',
                'transition-all duration-200 hover:bg-[#1a1a26] hover:shadow-lg',
                colors.border,
                colors.shadow,
            )}>
                <div className="space-y-1 min-w-0">
                    <p className="text-sm text-slate-400 font-medium">{label}</p>
                    <motion.p
                        key={String(value)}
                        initial={{ opacity: 0.6, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="text-2xl font-bold text-white tabular-nums"
                    >
                        {value}
                    </motion.p>
                    {trend && (
                        <p className={cn(
                            'text-xs font-medium',
                            trend.value >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        )}>
                            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
                        </p>
                    )}
                </div>
                <div className={cn('p-2.5 rounded-xl shrink-0', colors.icon)}>
                    {icon}
                </div>
            </div>
        </motion.div>
    )
}
