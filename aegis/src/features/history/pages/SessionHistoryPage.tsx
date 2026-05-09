import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Calendar, ChevronRight, Video, X, ShieldAlert, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageSpinner, Spinner } from '@/components/ui/Spinner'
import { useSessions } from '@/features/sessions/hooks/useSessions'
import { getSessionEvents } from '@/services/supabase'
import { formatDate, formatDuration } from '@/lib/utils'
import type { ExamSessionRow, MonitoringEventRow, EventSeverity } from '@/services/supabase'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function severityVariant(severity: EventSeverity): 'rose' | 'amber' | 'slate' {
    if (severity === 'high') return 'rose'
    if (severity === 'medium') return 'amber'
    return 'slate'
}

const EVENT_LABELS: Record<string, string> = {
    no_face: 'Face Not Visible',
    multiple_faces: 'Multiple Faces',
    looking_away: 'Looking Away',
    tab_switch: 'Tab Switch',
    fullscreen_exit: 'Fullscreen Exit',
}

// ---------------------------------------------------------------------------
// Session Detail Drawer
// ---------------------------------------------------------------------------

interface DrawerProps {
    session: ExamSessionRow
    onClose: () => void
}

function SessionDetailDrawer({ session, onClose }: DrawerProps) {
    const [events, setEvents] = useState<MonitoringEventRow[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch events when drawer opens
    useState(() => {
        getSessionEvents(session.id)
            .then((data) => setEvents(data))
            .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load events'))
            .finally(() => setIsLoading(false))
    })

    const riskScore = Math.round(session.risk_score)

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed right-0 top-0 h-full w-full max-w-lg bg-[#111118] border-l border-[#2a2a3a] z-50 flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a3a] shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-white">Session Details</h2>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{session.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:bg-[#1c1c28] hover:text-slate-200 transition-colors"
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Session stats */}
                <div className="px-6 py-4 border-b border-[#2a2a3a] shrink-0">
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Status', value: <Badge variant={getStatusVariant(session.status)}>{session.status}</Badge> },
                            { label: 'Risk Score', value: <span className={`font-semibold ${riskScore >= 60 ? 'text-rose-400' : riskScore >= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>{riskScore}%</span> },
                            { label: 'Date', value: <span className="text-slate-300 text-sm">{formatDate(session.created_at)}</span> },
                            { label: 'Duration', value: <span className="text-slate-300 text-sm">{getSessionDuration(session)}</span> },
                            { label: 'Total Flags', value: <span className="text-slate-300 text-sm">{session.total_warnings}</span> },
                            { label: 'Tab Switches', value: <span className="text-slate-300 text-sm">{session.tab_switch_count}</span> },
                            { label: 'Fullscreen Exits', value: <span className="text-slate-300 text-sm">{session.fullscreen_violations}</span> },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-[#16161f] rounded-lg px-3 py-2.5">
                                <p className="text-xs text-slate-500 mb-1">{label}</p>
                                {value}
                            </div>
                        ))}
                    </div>

                    {/* Risk bar */}
                    <div className="mt-3 space-y-1.5">
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>Risk Score</span>
                            <span>{riskScore}%</span>
                        </div>
                        <div className="h-1.5 bg-[#2a2a3a] rounded-full overflow-hidden">
                            <div
                                style={{ width: `${riskScore}%` }}
                                className={`h-full rounded-full transition-all duration-700 ${riskScore >= 60 ? 'bg-rose-500' : riskScore >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                            />
                        </div>
                    </div>
                </div>

                {/* Events list */}
                <div className="flex-1 overflow-y-auto">
                    <div className="px-6 py-3 border-b border-[#2a2a3a]">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                <AlertTriangle size={14} className="text-amber-400" />
                                Detection Events
                            </h3>
                            {!isLoading && (
                                <Badge variant="slate">{events.length}</Badge>
                            )}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Spinner size={24} />
                        </div>
                    ) : error ? (
                        <div className="px-6 py-8 text-center text-slate-500 text-sm">{error}</div>
                    ) : events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
                            <ShieldAlert size={28} className="opacity-40" />
                            <p className="text-sm">No events recorded for this session.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#2a2a3a]">
                            {events.map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-center justify-between px-6 py-3 hover:bg-[#1a1a26] transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${event.severity === 'high' ? 'bg-rose-500'
                                                : event.severity === 'medium' ? 'bg-amber-500'
                                                    : 'bg-slate-500'
                                            }`} />
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">
                                                {EVENT_LABELS[event.event_type] ?? event.event_type}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Clock size={10} className="text-slate-600" />
                                                <span className="text-xs text-slate-500">
                                                    {new Date(event.created_at).toLocaleTimeString()}
                                                </span>
                                                {event.confidence_score != null && (
                                                    <span className="text-xs text-slate-600">
                                                        · {Math.round(event.confidence_score * 100)}% confidence
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant={severityVariant(event.severity)}>
                                        {event.severity}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function SessionHistoryPage() {
    const [query, setQuery] = useState('')
    const [selectedSession, setSelectedSession] = useState<ExamSessionRow | null>(null)
    const { sessions, isLoading, error } = useSessions()

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

    const handleView = useCallback((session: ExamSessionRow) => {
        setSelectedSession(session)
    }, [])

    const handleCloseDrawer = useCallback(() => {
        setSelectedSession(null)
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
                    <p className="text-rose-400 font-medium">Failed to load session history</p>
                    <p className="text-slate-500 text-sm">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <>
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
                                        {query ? 'No sessions match your search.' : 'No completed sessions yet.'}
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
                                                    onClick={() => handleView(session)}
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

            {/* Session detail drawer */}
            <AnimatePresence>
                {selectedSession && (
                    <SessionDetailDrawer
                        session={selectedSession}
                        onClose={handleCloseDrawer}
                    />
                )}
            </AnimatePresence>
        </>
    )
}
