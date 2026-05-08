/**
 * Monitoring events service — insert AI detections + realtime feed.
 */

import { supabase } from './client'
import type {
    MonitoringEventRow,
    MonitoringEventInsert,
    EventSnapshot,
} from './types'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetch all events for a session, newest first. */
export async function getSessionEvents(sessionId: string): Promise<MonitoringEventRow[]> {
    const { data, error } = await supabase
        .from('monitoring_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Record a single AI-detected monitoring event.
 * The DB trigger automatically updates the parent session's risk_score
 * and counter columns — no extra round-trip needed.
 */
export async function recordEvent(
    event: MonitoringEventInsert,
): Promise<MonitoringEventRow> {
    const { data, error } = await supabase
        .from('monitoring_events')
        .insert(event)
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * Convenience wrapper — builds the insert payload from typed args.
 * `isSuspicious` defaults to true; pass false for informational/benign events.
 */
export async function recordDetection(params: {
    sessionId: string
    eventType: MonitoringEventInsert['event_type']
    severity: MonitoringEventInsert['severity']
    confidenceScore?: number
    snapshot?: EventSnapshot
    screenshotUrl?: string
    isSuspicious?: boolean
}): Promise<MonitoringEventRow> {
    return recordEvent({
        session_id: params.sessionId,
        event_type: params.eventType,
        severity: params.severity,
        confidence_score: params.confidenceScore ?? null,
        event_snapshot: params.snapshot ? (params.snapshot as Record<string, unknown>) : null,
        screenshot_url: params.screenshotUrl ?? null,
        is_suspicious: params.isSuspicious ?? true,
    })
}

/**
 * Fetch only suspicious events for a session.
 * Hits the partial index `idx_monitoring_events_is_suspicious` — fast for dashboard feeds.
 */
export async function getSuspiciousEvents(sessionId: string): Promise<MonitoringEventRow[]> {
    const { data, error } = await supabase
        .from('monitoring_events')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_suspicious', true)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

/**
 * Fetch events filtered by severity — useful for dashboard aggregation panels.
 */
export async function getEventsBySeverity(
    sessionId: string,
    severity: MonitoringEventInsert['severity'],
): Promise<MonitoringEventRow[]> {
    const { data, error } = await supabase
        .from('monitoring_events')
        .select('*')
        .eq('session_id', sessionId)
        .eq('severity', severity)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

// ---------------------------------------------------------------------------
// Realtime
// ---------------------------------------------------------------------------

/**
 * Subscribe to new monitoring events for a session.
 * Fires onInsert for every new row — ideal for live alert feeds.
 *
 * @example
 * const channel = subscribeToEvents(sessionId, (e) => addAlert(e))
 * return () => channel.unsubscribe()
 */
export function subscribeToEvents(
    sessionId: string,
    onInsert: (event: MonitoringEventRow) => void,
): RealtimeChannel {
    return supabase
        .channel(`events:${sessionId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'monitoring_events',
                filter: `session_id=eq.${sessionId}`,
            },
            (payload) => onInsert(payload.new as MonitoringEventRow),
        )
        .subscribe()
}
