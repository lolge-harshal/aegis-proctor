/**
 * Exam session service — CRUD + realtime helpers.
 */

import { supabase } from './client'
import type {
    ExamSessionRow,
    ExamSessionInsert,
    ExamSessionUpdate,
    SessionStatus,
} from './types'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetch all sessions for the current user, newest first. */
export async function getUserSessions(): Promise<ExamSessionRow[]> {
    const { data, error } = await supabase
        .from('exam_sessions')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

/** Fetch a single session by ID. */
export async function getSession(id: string): Promise<ExamSessionRow> {
    const { data, error } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw error
    return data
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Start a new exam session for the authenticated user. */
export async function startSession(userId: string): Promise<ExamSessionRow> {
    const payload: ExamSessionInsert = {
        user_id: userId,
        status: 'active',
        started_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
        .from('exam_sessions')
        .insert(payload)
        .select()
        .single()

    if (error) throw error
    return data
}

/** End a session — sets status and ended_at. */
export async function endSession(
    id: string,
    status: Extract<SessionStatus, 'completed' | 'terminated'> = 'completed',
): Promise<ExamSessionRow> {
    const update: ExamSessionUpdate = {
        status,
        ended_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
        .from('exam_sessions')
        .update(update)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

/** Generic session update (e.g. bump risk_score manually). */
export async function updateSession(
    id: string,
    update: ExamSessionUpdate,
): Promise<ExamSessionRow> {
    const { data, error } = await supabase
        .from('exam_sessions')
        .update(update)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

// ---------------------------------------------------------------------------
// Realtime
// ---------------------------------------------------------------------------

/**
 * Subscribe to live changes on a single session row.
 * Returns the channel so the caller can unsubscribe.
 *
 * @example
 * const channel = subscribeToSession(sessionId, (row) => setSession(row))
 * return () => channel.unsubscribe()
 */
export function subscribeToSession(
    sessionId: string,
    onUpdate: (session: ExamSessionRow) => void,
): RealtimeChannel {
    return supabase
        .channel(`session:${sessionId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'exam_sessions',
                filter: `id=eq.${sessionId}`,
            },
            (payload) => onUpdate(payload.new as ExamSessionRow),
        )
        .subscribe()
}
