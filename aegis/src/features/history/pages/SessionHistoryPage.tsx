import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Calendar, ChevronRight, Video } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import { useSessions } from '@/features/sessions/hooks/useSessions'
import { formatDate, formatDuration } from '@/lib/utils'
import type { ExamSessionRow } from '@/services/supabase'

function getSessionDuration(session: ExamSessionRow): string {
    if (!session.started_at || !session.ended_at) return '—'
    const diffSeconds = Math.floor(
        (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000
    )
    return formatDuration(diffSeconds)
}

function getStatusVariant(status: ExamSessionRow['status']) {
    if (status === 'active') return 'rose'
    if (status === 'completed') return 'emerald'
    return 'slate'
}

export function SessionHistoryPage() {
    const [query, setQuery] = useState('')
    const { sessions, isLoading, error } = useSessions()

    // Only show non-active (historical) sessions, newest first
    const historicalSessions = useMemo(
        () => sessions.filter((s) => s.status !== 'active'),
        [sessions]
    )

    const filtered = useMemo(() => {
        const q = query.toLowerCase()
        if (!q) return historicalSessions
        return historicalSessions.filter(
            (s) =>
                s.id.toLowerCase().includes(q) ||
                s.status.toLowerCase().includes(q) ||
                formatDate(s.created_at).toLowerCase().includes(q)
        )
    }, [historicalSessions, query])

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
                    <p className="text-rose-400 font-medium">Failed to load session history</p>
                    <p className="text-slate-500 text-sm">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between flex-wrap gap-3"
            >
                <div>
                    <h1 className="text-2xl font-bold text-white">Session History</h1>
                    <p className="text-slate-400 text-sm mt-0.5">
                        Browse and review all past proctoring sessions.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Calendar size={15} />
                    <span>{historicalSessions.length} sessions total</span>
                </div>
            </motion.div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Input
                    placeholder="Search by session ID, status, or date..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    icon={<Search size={15} />}
                />
            </motion.div>

            {/* Sessions list */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                <Card>
                    <CardHeader>
                        <h2 className="text-base font-semibold text-white">
                            {filtered.length} session{filtered.length !== 1 ? 's' : ''}
                        </h2>
                    </CardHeader>
                    <CardBody className="p-0">
                        {filtered.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 space-y-2">
                                <Video size={32} className="mx-auto opacity-40" />
                                <p className="text-sm">
                                    {query
                                        ? 'No sessions match your search.'
                                        : 'No completed sessions yet.'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#2a2a3a]">
                                {filtered.map((session, i) => (
                                    <motion.div
                                        key={session.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="flex items-center justify-between px-5 py-4 hover:bg-[#1a1a26] transition-colors group"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                                                <Video size={16} className="text-indigo-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-200 truncate">
                                                    Exam Session
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                    <span className="text-xs text-slate-500 font-mono">
                                                        {session.id.slice(0, 8)}…
                                                    </span>
                                                    <span className="text-slate-600">·</span>
                                                    <span className="text-xs text-slate-500">
                                                        {formatDate(session.created_at)}
                                                    </span>
                                                    <span className="text-slate-600">·</span>
                                                    <span className="text-xs text-slate-500">
                                                        {getSessionDuration(session)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs text-slate-400 hidden sm:block">
                                                Risk: {Math.round(session.risk_score)}%
                                            </span>
                                            {session.total_warnings > 0 ? (
                                                <Badge variant="amber">
                                                    {session.total_warnings} flags
                                                </Badge>
                                            ) : (
                                                <Badge variant="emerald">Clean</Badge>
                                            )}
                                            <Badge variant={getStatusVariant(session.status)}>
                                                {session.status}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={<ChevronRight size={14} />}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                View
                                            </Button>
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
