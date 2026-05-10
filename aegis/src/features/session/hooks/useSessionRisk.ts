/**
 * Subscribes to live updates on an exam_sessions row.
 * Keeps the monitoringStore risk score map in sync and optionally
 * calls back with the full updated row (e.g. to refresh participant data).
 *
 * Uses supabase.removeChannel() (not just channel.unsubscribe()) so the
 * channel is fully removed from the Supabase client registry. Combined with
 * unique channel names in subscribeToSession(), this prevents the
 * "cannot add postgres_changes callbacks after subscribe()" error that
 * occurs in React Strict Mode's double-invocation of effects.
 */

import { useEffect, useRef } from 'react'
import { subscribeToSession } from '@/services/supabase'
import { supabase } from '@/services/supabase/client'
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

        // Fully remove any existing channel from the registry before creating a new one
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current)
            channelRef.current = null
        }

        channelRef.current = subscribeToSession(sessionId, (session) => {
            updateRiskScore(sessionId, session.risk_score)
            onUpdate?.(session)
        })

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
                channelRef.current = null
            }
        }
    }, [sessionId, updateRiskScore, onUpdate])
}
