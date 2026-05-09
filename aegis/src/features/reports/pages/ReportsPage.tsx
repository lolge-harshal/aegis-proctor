import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Download, Filter, TrendingUp, AlertTriangle, Users, Clock } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { PageSpinner } from '@/components/ui/Spinner'
import { useReportsData } from '@/features/reports/hooks/useReportsData'
import { downloadCsv } from '@/lib/exportCsv'
import { formatDate, formatDuration } from '@/lib/utils'
import type { ExamSessionRow, MonitoringEventRow } from '@/services/supabase'
import type { SessionWithEvents } from '@/features/reports/hooks/useReportsData'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRiskVariant(riskScore: number): 'rose' | 'amber' | 'emerald' {
    if (riskScore >= 60) return 'rose'
    if (riskScore >= 30) return 'amber'
    return 'emerald'
}

function getRiskLabel(riskScore: number): string {
    if (riskScore >= 60) return 'high'
    if (riskScore >= 30) return 'medium'
    return 'low'
}

function getSessionDuration(session: ExamSessionRow): string {
    if (!session.started_at || !session.ended_at) return '—'
    const diffSeconds = Math.floor(
        (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000
    )
    return formatDuration(diffSeconds)
}

/** Build a flat CSV row for a single monitoring event. */
function eventToCsvRow(event: MonitoringEventRow, session: ExamSessionRow) {
    return {
        session_id: session.id,
        session_date: formatDate(session.created_at),
        event_id: event.id,
        event_type: event.event_type,
        severity: event.severity,
        confidence_score: event.confidence_score ?? '',
        is_suspicious: event.is_suspicious,
        detected_at: new Date(event.created_at).toLocaleString(),
    }
}

/** Build a summary CSV row for a single session. */
function sessionToCsvRow(session: ExamSessionRow, eventCount: number) {
    return {
        session_id: session.id,
        date: formatDate(session.created_at),
        duration: getSessionDuration(session),
        status: session.status,
        risk_score: `${Math.round(session.risk_score)}%`,
        risk_level: getRiskLabel(session.risk_score),
        total_flags: session.total_warnings,
        tab_switches: session.tab_switch_count,
        fullscreen_violations: session.fullscreen_violations,
        event_count: eventCount,
    }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReportsPage() {
    const { summary, isLoading, error } = useReportsData()

    // ── Export all sessions as a summary CSV ─────────────────────────────────
    const handleExportAll = useCallback(() => {
        if (!summary) return
        const rows = summary.sessionRows.map(({ session, events }) =>
            sessionToCsvRow(session, events.length)
        )
        downloadCsv(`aegis-sessions-${new Date().toISOString().slice(0, 10)}.csv`, rows)
    }, [summary])

    // ── Export a single session's events as CSV ───────────────────────────────
    const handleExportSession = useCallback((row: SessionWithEvents) => {
        if (row.events.length === 0) {
            // Export session summary row even if no events
            downloadCsv(
                `aegis-session-${row.session.id.slice(0, 8)}.csv`,
                [sessionToCsvRow(row.session, 0)]
            )
            return
        }
        const csvRows = row.events.map((e) => eventToCsvRow(e, row.session))
        downloadCsv(`aegis-session-${row.session.id.slice(0, 8)}.csv`, csvRows)
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
                    <p className="text-rose-400 font-medium">Failed to load reports</p>
                    <p className="text-slate-500 text-sm">{error}</p>
                </div>
            </div>
        )
    }

    if (!summary) return null

    const REPORT_STATS = [
        { label: 'Total Sessions', value: summary.totalSessions, icon: <BarChart3 size={20} />, accent: 'indigo' as const },
        { label: 'Avg. Risk Score', value: `${summary.avgRiskScore}%`, icon: <TrendingUp size={20} />, accent: 'cyan' as const },
        { label: 'Total Flags', value: summary.totalFlags, icon: <AlertTriangle size={20} />, accent: 'amber' as const },
        { label: 'Sessions w/ Flags', value: summary.sessionsWithFlags, icon: <Users size={20} />, accent: 'emerald' as const },
    ]

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between flex-wrap gap-3"
            >
                <div>
                    <h1 className="text-2xl font-bold text-white">Reports</h1>
                    <p className="text-slate-400 text-sm mt-0.5">
                        Analytics and insights across all sessions.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" icon={<Filter size={14} />}>
                        Filter
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={<Download size={14} />}
                        onClick={handleExportAll}
                        disabled={summary.sessionRows.length === 0}
                    >
                        Export All
                    </Button>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {REPORT_STATS.map((s, i) => (
                    <StatCard key={s.label} {...s} index={i} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Flag breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="h-full">
                        <CardHeader>
                            <h2 className="text-base font-semibold text-white">Flag Breakdown</h2>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            {summary.flagBreakdown.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-4">
                                    No flags recorded yet.
                                </p>
                            ) : (
                                summary.flagBreakdown.map((f) => (
                                    <div key={f.eventType} className="space-y-1.5">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-300">{f.label}</span>
                                            <span className="text-slate-400">{f.count}</span>
                                        </div>
                                        <div className="h-2 bg-[#2a2a3a] rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${f.pct}%` }}
                                                transition={{ duration: 0.7, delay: 0.3 }}
                                                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardBody>
                    </Card>
                </motion.div>

                {/* Session activity chart */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="lg:col-span-2"
                >
                    <Card className="h-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-semibold text-white">Session Activity</h2>
                                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                    <Clock size={13} />
                                    <span>Last 14 days</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardBody className="flex items-end gap-1.5 h-40">
                            {summary.activityBars.map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scaleY: 0 }}
                                    animate={{ scaleY: 1 }}
                                    transition={{ duration: 0.4, delay: i * 0.04 }}
                                    style={{ height: `${Math.max(h, 4)}%`, originY: 1 }}
                                    className="flex-1 bg-gradient-to-t from-indigo-600 to-indigo-400/60 rounded-t-sm min-w-0"
                                />
                            ))}
                        </CardBody>
                    </Card>
                </motion.div>
            </div>

            {/* Reports table */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
            >
                <Card>
                    <CardHeader>
                        <h2 className="text-base font-semibold text-white">Session Reports</h2>
                    </CardHeader>
                    {summary.sessionRows.length === 0 ? (
                        <CardBody>
                            <p className="text-slate-500 text-sm text-center py-6">
                                No completed sessions to report on yet.
                            </p>
                        </CardBody>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#2a2a3a]">
                                        {['Session ID', 'Date', 'Duration', 'Flags', 'Risk Score', 'Risk', ''].map((h) => (
                                            <th
                                                key={h}
                                                className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2a2a3a]">
                                    {summary.sessionRows.map((row) => (
                                        <tr
                                            key={row.session.id}
                                            className="hover:bg-[#1a1a26] transition-colors"
                                        >
                                            <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">
                                                {row.session.id.slice(0, 8)}…
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-400">
                                                {formatDate(row.session.created_at)}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-400">
                                                {getSessionDuration(row.session)}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-300">
                                                {row.events.length}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-300">
                                                {Math.round(row.session.risk_score)}%
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <Badge variant={getRiskVariant(row.session.risk_score)}>
                                                    {getRiskLabel(row.session.risk_score)}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={<Download size={13} />}
                                                    onClick={() => handleExportSession(row)}
                                                >
                                                    Export
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </motion.div>
        </div>
    )
}
