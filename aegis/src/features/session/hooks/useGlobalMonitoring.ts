/**
 * Keeps realtime monitoring subscriptions alive for the duration of the app session,
 * regardless of which page is currently rendered.
 *
 * Mount this once in AppLayout. It reads sessionId from the Zustand store so it
 * automatically subscribes when a session starts and unsubscribes when it ends.
 */

import { useCallback } from 'react'
import { useSessionStore } from '@/store/sessionStore'
import { useMonitoringStore } from '@/store/monitoringStore'
import { useMonitoringEvents } from './useMonitoringEvents'
import { useSessionRisk } from './useSessionRisk'
import type { ExamSessionRow } from '@/services/supabase'

export function useGlobalMonitoring() {
    const sessionId = useSessionStore((s) => s.sessionId)
    const updateRiskScore = useMonitoringStore((s) => s.updateRiskScore)

    const handleSessionUpdate = useCallback(
        (row: ExamSessionRow) => {
            updateRiskScore(row.id, row.risk_score)
        },
        [updateRiskScore]
    )

    // Both hooks are no-ops when sessionId is null
    useMonitoringEvents(sessionId)
    useSessionRisk(sessionId, handleSessionUpdate)
}
