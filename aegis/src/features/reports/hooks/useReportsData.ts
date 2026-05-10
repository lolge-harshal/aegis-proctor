import { useEffect, useState, useCallback } from 'react'
import { getUserSessions, getSessionEvents } from '@/services/supabase'
import type { ExamSessionRow, MonitoringEventRow, EventType } from '@/services/supabase'

export interface SessionWithEvents {
    session: ExamSessionRow
    events: MonitoringEventRow[]
}

export interface FlagBreakdown {
    label: string
    eventType: EventType
    count: number
    pct: number
}

export interface ReportsSummary {
    totalSessions: number
    avgRiskScore: number
    totalFlags: number
    /** Number of sessions with at least one event */
    sessionsWithFlags: number
    flagBreakdown: FlagBreakdown[]
    /** Sessions sorted newest-first, with their events */
    sessionRows: SessionWithEvents[]
    /** Daily session counts for the activity chart (last 14 days) */
    activityBars: number[]
}

interface UseReportsDataResult {
    summary: ReportsSummary | null
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
    no_face: 'Face Not Visible',
    multiple_faces: 'Multiple Faces',
    looking_away: 'Looking Away',
    tab_switch: 'Tab Switch',
    fullscreen_exit: 'Fullscreen Exit',
}

export function useReportsData(): UseReportsDataResult {
    const [summary, setSummary] = useState<ReportsSummary | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAll = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const sessions = await getUserSessions()
            const completedSessions = sessions.filter((s) => s.status !== 'active')

            // Fetch events for all completed sessions in parallel (cap at 20 most recent)
            const recentSessions = completedSessions.slice(0, 20)
            const eventsPerSession = await Promise.all(
                recentSessions.map((s) =>
                    getSessionEvents(s.id).catch(() => [] as MonitoringEventRow[])
                )
            )

            const sessionRows: SessionWithEvents[] = recentSessions.map((session, i) => ({
                session,
                events: eventsPerSession[i],
            }))

            // Aggregate stats
            const allEvents = eventsPerSession.flat()
            const totalFlags = allEvents.length
            const avgRiskScore =
                completedSessions.length > 0
                    ? completedSessions.reduce((sum, s) => sum + s.risk_score, 0) /
                    completedSessions.length
                    : 0
            const sessionsWithFlags = sessionRows.filter((r) => r.events.length > 0).length

            // Flag breakdown by event type
            const countByType = allEvents.reduce<Partial<Record<EventType, number>>>(
                (acc, e) => {
                    acc[e.event_type] = (acc[e.event_type] ?? 0) + 1
                    return acc
                },
                {}
            )
            const flagBreakdown: FlagBreakdown[] = (
                Object.entries(countByType) as [EventType, number][]
            )
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => ({
                    label: EVENT_TYPE_LABELS[type],
                    eventType: type,
                    count,
                    pct: totalFlags > 0 ? Math.round((count / totalFlags) * 100) : 0,
                }))

            // Activity bars — sessions per day for last 14 days
            const now = Date.now()
            const DAY_MS = 86_400_000
            const activityBars = Array.from({ length: 14 }, (_, i) => {
                const dayStart = now - (13 - i) * DAY_MS
                const dayEnd = dayStart + DAY_MS
                return completedSessions.filter((s) => {
                    const t = new Date(s.created_at).getTime()
                    return t >= dayStart && t < dayEnd
                }).length
            })
            // Normalise to 0–100 for bar heights
            const maxBar = Math.max(...activityBars, 1)
            const normalisedBars = activityBars.map((v) => Math.round((v / maxBar) * 100))

            setSummary({
                totalSessions: completedSessions.length,
                avgRiskScore: Math.round(avgRiskScore),
                totalFlags,
                sessionsWithFlags,
                flagBreakdown,
                sessionRows,
                activityBars: normalisedBars,
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load reports.')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAll()
    }, [fetchAll])

    return { summary, isLoading, error, refetch: fetchAll }
}
