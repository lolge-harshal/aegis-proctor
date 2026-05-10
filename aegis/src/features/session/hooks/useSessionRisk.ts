/**
 * Subscribes to live updates on an exam_sessions row.
 * Keeps the monitoringStore risk score map in sync and optionally
 * calls back with the full updated row (e.g. to refresh participant data).
 */

import { useEffect, useRef } from 'react'
import { subscribeToSession } from '@/services/supabase'
import { useMonitoringStore } from '@/store/monitoringStore'
import type { ExamSessionRow } from '@/services/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useSessionRisk(
    sessionId: string | null,
    onUpdate?: (session: ExamSessionRow) => void
) {
    const updateRiskScore = useMonitoringStore((s) => s.updateRiskScore)
    const channelRef = useRef<RealtimeChannel | null>(null)

    useEffect(() => {
        if (!sessionId) return

        if (channelRef.current) {
            channelRef.current.unsubscribe()
            channelRef.current = null
        }

        channelRef.current = subscribeToSession(sessionId, (session) => {
            updateRiskScore(sessionId, session.risk_score)
            onUpdate?.(session)
        })

        return () => {
            channelRef.current?.unsubscribe()
            channelRef.current = null
        }
    }, [sessionId, updateRiskScore, onUpdate])
}
