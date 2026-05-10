import { useEffect, useRef, useState, useCallback } from 'react'
import {
    getUserSessions,
    subscribeToSession,
} from '@/services/supabase'
import type { ExamSessionRow } from '@/services/supabase'

interface UseSessionsResult {
    sessions: ExamSessionRow[]
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
}

/**
 * Fetches all sessions for the current user and keeps the list fresh.
 * Optionally subscribes to realtime updates on a specific active session id.
 */
export function useSessions(activeSessionId?: string | null): UseSessionsResult {
    const [sessions, setSessions] = useState<ExamSessionRow[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const channelRef = useRef<ReturnType<typeof subscribeToSession> | null>(null)

    const fetchSessions = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await getUserSessions()
            setSessions(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load sessions.')
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Initial fetch
    useEffect(() => {
        fetchSessions()
    }, [fetchSessions])

    // Realtime subscription on the active session row
    useEffect(() => {
        if (!activeSessionId) return

        channelRef.current = subscribeToSession(activeSessionId, (updated) => {
            setSessions((prev) =>
                prev.map((s) => (s.id === updated.id ? updated : s))
            )
        })

        return () => {
            channelRef.current?.unsubscribe()
            channelRef.current = null
        }
    }, [activeSessionId])

    return { sessions, isLoading, error, refetch: fetchSessions }
}
