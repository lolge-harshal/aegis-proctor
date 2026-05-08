import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Card, CardBody } from './Card'
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
    indigo: 'bg-indigo-500/10 text-indigo-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    rose: 'bg-rose-500/10 text-rose-400',
    amber: 'bg-amber-500/10 text-amber-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
}

export function StatCard({ label, value, icon, trend, accent = 'indigo', index = 0 }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
        >
            <Card hover>
                <CardBody className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-sm text-slate-400">{label}</p>
                        <p className="text-2xl font-bold text-white">{value}</p>
                        {trend && (
                            <p
                                className={cn(
                                    'text-xs font-medium',
                                    trend.value >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                )}
                            >
                                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
                            </p>
                        )}
                    </div>
                    <div className={cn('p-3 rounded-xl', accentMap[accent])}>{icon}</div>
                </CardBody>
            </Card>
        </motion.div>
    )
}
