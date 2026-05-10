/**
 * Subscribes to realtime monitoring events for a session.
 *
 * - Prevents duplicate subscriptions via a channel ref
 * - Debounces rapid bursts so the store isn't hammered
 * - Cleans up the channel on unmount or sessionId change
 */

import { useEffect, useRef, useCallback } from 'react'
import { subscribeToEvents } from '@/services/supabase'
import { useMonitoringStore } from '@/store/monitoringStore'
import type { MonitoringEventRow } from '@/services/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

const DEBOUNCE_MS = 120

export function useMonitoringEvents(sessionId: string | null) {
    const pushEvent = useMonitoringStore((s) => s.pushEvent)
    const channelRef = useRef<RealtimeChannel | null>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pendingRef = useRef<MonitoringEventRow[]>([])

    const flush = useCallback(() => {
        const batch = pendingRef.current.splice(0)
        batch.forEach(pushEvent)
    }, [pushEvent])

    const handleInsert = useCallback(
        (event: MonitoringEventRow) => {
            pendingRef.current.push(event)
            if (debounceRef.current) clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(flush, DEBOUNCE_MS)
        },
        [flush]
    )

    useEffect(() => {
        if (!sessionId) return

        if (channelRef.current) {
            channelRef.current.unsubscribe()
            channelRef.current = null
        }

        channelRef.current = subscribeToEvents(sessionId, handleInsert)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
            if (pendingRef.current.length > 0) flush()
            channelRef.current?.unsubscribe()
            channelRef.current = null
        }
    }, [sessionId, handleInsert, flush])
}
