import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Users, AlertTriangle, CheckCircle, ArrowRight, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useMonitoringStore } from '@/store/monitoringStore'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import { useNavigate } from 'react-router-dom'
import { useSessions } from '@/features/sessions/hooks/useSessions'
import { formatDate, cn } from '@/lib/utils'
import type { ExamSessionRow } from '@/services/supabase'

function getStatusVariant(status: ExamSessionRow['status']) {
    if (status === 'active') return 'rose'
    if (status === 'completed') return 'emerald'
    return 'slate'
}

function getStatusLabel(status: ExamSessionRow['status']) {
    if (status === 'active') return 'Live'
    if (status === 'completed') return 'Completed'
    return 'Terminated'
}

export function DashboardPage() {
    const user = useAuthStore((s) => s.user)
    const navigate = useNavigate()
    const { sessions, isLoading, error } = useSessions()

    const totalFlags = useMonitoringStore((s) => s.metrics.totalFlags)
    const highSeverityCount = useMonitoringStore((s) => s.metrics.highSeverityCount)

    const stats = useMemo(() => {
        const active = sessions.filter((s) => s.status === 'active').length
        const completed = sessions.filter((s) => s.status === 'completed').length
        const totalWarnings = sessions.reduce((sum, s) => sum + s.total_warnings, 0)
        return { active, completed, totalWarnings }
    }, [sessions])

    const recentSessions = useMemo(() => sessions.slice(0, 5), [sessions])

    const greeting = useMemo(() => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 18) return 'Good afternoon'
        return 'Good evening'
    }, [])

    if (isLoading) return <PageSpinner />

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-2">
                    <p className="text-rose-400 font-medium">Failed to load dashboard</p>
                    <p className="text-slate-600 text-sm">{error}</p>
                </div>
            </div>
        )
    }

    const STATS = [
        { label: 'Active Sessions', value: stats.active, icon: <Video size={20} />, accent: 'indigo' as const },
        { label: 'Total Sessions', value: sessions.length, icon: <Users size={20} />, accent: 'cyan' as const },
        { label: 'Flags Raised', value: stats.totalWarnings + totalFlags, icon: <AlertTriangle size={20} />, accent: 'amber' as const },
        { label: 'Sessions Completed', value: stats.completed, icon: <CheckCircle size={20} />, accent: 'emerald' as const },
    ]

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Page header */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex items-center justify-between flex-wrap gap-3"
            >
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        {greeting}, {user?.name?.split(' ')[0]}
                        <span className="ml-2 text-2xl">👋</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">Here's what's happening today.</p>
                </div>
                <Button icon={<Video size={14} />} onClick={() => navigate('/session/live')}>
                    Start Session
                </Button>
            </motion.div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {STATS.map((stat, i) => (
                    <StatCard key={stat.label} {...stat} index={i} />
                ))}
            </div>

            {/* High-severity alert banner */}
            <AnimatePresence>
                {highSeverityCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.99 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-rose-500/8 border border-rose-500/20 shadow-lg shadow-rose-500/5"
                    >
                        <div className="relative shrink-0">
                            <Zap size={16} className="text-rose-400" />
                        </div>
                        <p className="text-sm text-rose-300 flex-1">
                            <span className="font-semibold">{highSeverityCount} high-severity</span>{' '}
                            event{highSeverityCount !== 1 ? 's' : ''} detected in the current session.
                        </p>
                        <Button
                            variant="danger"
                            size="sm"
                            icon={<ArrowRight size={13} />}
                            className="ml-auto shrink-0"
                            onClick={() => navigate('/session/live')}
                        >
                            View Session
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Recent sessions */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-white">Recent Sessions</h2>
                            <Button variant="ghost" size="sm" icon={<ArrowRight size={13} />} onClick={() => navigate('/history')}>
                                View all
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0">
                        {recentSessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-700 space-y-3">
                                <div className="w-12 h-12 rounded-xl bg-[#1c1c28] flex items-center justify-center">
                                    <Video size={20} className="opacity-40" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-sm font-medium text-slate-600">No sessions yet</p>
                                    <p className="text-xs text-slate-700">Start your first proctoring session</p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#1e1e2e]">
                                {recentSessions.map((session, i) => (
                                    <motion.div
                                        key={session.id}
                                        initial={{ opacity: 0, x: -6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.05 }}
                                        className="flex items-center justify-between px-5 py-3.5 hover:bg-[#1a1a26] transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                                                session.status === 'active'
                                                    ? 'bg-rose-500/10 group-hover:bg-rose-500/15'
                                                    : 'bg-indigo-500/10 group-hover:bg-indigo-500/15'
                                            )}>
                                                <Video size={13} className={session.status === 'active' ? 'text-rose-400' : 'text-indigo-400'} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-200">Session</p>
                                                <p className="text-xs text-slate-600 font-mono">
                                                    {session.id.slice(0, 8)}… · {formatDate(session.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {session.total_warnings > 0 && (
                                                <Badge variant="amber">
                                                    {session.total_warnings} flags
                                                </Badge>
                                            )}
                                            <Badge
                                                variant={getStatusVariant(session.status)}
                                                pulse={session.status === 'active'}
                                            >
                                                {getStatusLabel(session.status)}
                                            </Badge>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </motion.div>
        </div>
    )
}
