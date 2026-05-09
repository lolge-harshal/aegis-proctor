import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Video, Users, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import { useNavigate } from 'react-router-dom'
import { useSessions } from '@/features/sessions/hooks/useSessions'
import { formatDate } from '@/lib/utils'
import type { ExamSessionRow } from '@/services/supabase'

function getStatusVariant(status: ExamSessionRow['status']) {
    if (status === 'active') return 'rose'
    if (status === 'completed') return 'emerald'
    return 'slate'
}

function getStatusLabel(status: ExamSessionRow['status']) {
    if (status === 'active') return '● Live'
    if (status === 'completed') return 'Completed'
    return 'Terminated'
}

export function DashboardPage() {
    const user = useAuthStore((s) => s.user)
    const navigate = useNavigate()
    const { sessions, isLoading, error } = useSessions()

    const stats = useMemo(() => {
        const active = sessions.filter((s) => s.status === 'active').length
        const completed = sessions.filter((s) => s.status === 'completed').length
        const totalWarnings = sessions.reduce((sum, s) => sum + s.total_warnings, 0)
        // Approximate total participants — not stored per-session in schema,
        // so we surface total_warnings as "Flags Raised" and session counts.
        return { active, completed, totalWarnings }
    }, [sessions])

    const recentSessions = useMemo(() => sessions.slice(0, 5), [sessions])

    const greeting = useMemo(() => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 18) return 'Good afternoon'
        return 'Good evening'
    }, [])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <PageSpinner />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-2">
                    <p className="text-rose-400 font-medium">Failed to load dashboard</p>
                    <p className="text-slate-500 text-sm">{error}</p>
                </div>
            </div>
        )
    }

    const STATS = [
        {
            label: 'Active Sessions',
            value: stats.active,
            icon: <Video size={20} />,
            accent: 'indigo' as const,
        },
        {
            label: 'Total Sessions',
            value: sessions.length,
            icon: <Users size={20} />,
            accent: 'cyan' as const,
        },
        {
            label: 'Flags Raised',
            value: stats.totalWarnings,
            icon: <AlertTriangle size={20} />,
            accent: 'amber' as const,
        },
        {
            label: 'Sessions Completed',
            value: stats.completed,
            icon: <CheckCircle size={20} />,
            accent: 'emerald' as const,
        },
    ]

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Page header */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        {greeting}, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-slate-400 text-sm mt-0.5">Here's what's happening today.</p>
                </div>
                <Button icon={<Video size={15} />} onClick={() => navigate('/session/live')}>
                    Start Session
                </Button>
            </motion.div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {STATS.map((stat, i) => (
                    <StatCard key={stat.label} {...stat} index={i} />
                ))}
            </div>

            {/* Recent sessions */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
            >
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-white">Recent Sessions</h2>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
                                View all
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0">
                        {recentSessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
                                <Video size={32} className="opacity-40" />
                                <p className="text-sm">No sessions yet. Start your first one.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#2a2a3a]">
                                {recentSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="flex items-center justify-between px-5 py-3.5 hover:bg-[#1a1a26] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                                <Video size={14} className="text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-200">
                                                    Session
                                                </p>
                                                <p className="text-xs text-slate-500 font-mono">
                                                    {session.id.slice(0, 8)}… · {formatDate(session.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {session.total_warnings > 0 && (
                                                <Badge variant="amber">
                                                    {session.total_warnings} flags
                                                </Badge>
                                            )}
                                            <Badge variant={getStatusVariant(session.status)}>
                                                {getStatusLabel(session.status)}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </motion.div>
        </div>
    )
}
