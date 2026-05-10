/**
 * Monitoring store — holds the live event feed and aggregated dashboard metrics.
 * Updated by realtime Supabase subscriptions; never fetched on demand.
 */

import { create } from 'zustand'
import type { MonitoringEventRow } from '@/services/supabase'

export interface LiveEvent extends MonitoringEventRow {
    /** Client-side flag so the feed can animate new arrivals */
    isNew?: boolean
}

export interface DashboardMetrics {
    activeSessions: number
    totalFlags: number
    highSeverityCount: number
    /** Map of sessionId → latest risk_score */
    riskScores: Record<string, number>
}

interface MonitoringState {
    /** Capped at MAX_FEED_SIZE, newest first */
    liveEvents: LiveEvent[]
    metrics: DashboardMetrics
    /** IDs we've already seen — prevents duplicate inserts from reconnects */
    seenEventIds: Set<string>

    pushEvent: (event: MonitoringEventRow) => void
    markEventSeen: (id: string) => void
    updateRiskScore: (sessionId: string, score: number) => void
    incrementActiveSessions: () => void
    decrementActiveSessions: () => void
    resetFeed: () => void
}

const MAX_FEED_SIZE = 50

const defaultMetrics: DashboardMetrics = {
    activeSessions: 0,
    totalFlags: 0,
    highSeverityCount: 0,
    riskScores: {},
}

export const useMonitoringStore = create<MonitoringState>((set, get) => ({
    liveEvents: [],
    metrics: defaultMetrics,
    seenEventIds: new Set(),

    pushEvent: (event) => {
        const { seenEventIds, liveEvents, metrics } = get()

        // Deduplicate — Supabase realtime can replay on reconnect
        if (seenEventIds.has(event.id)) return

        const newSeen = new Set(seenEventIds)
        newSeen.add(event.id)

        const newEvent: LiveEvent = { ...event, isNew: true }

        // Keep feed capped
        const updatedFeed = [newEvent, ...liveEvents].slice(0, MAX_FEED_SIZE)

        // Update aggregated metrics
        const updatedMetrics: DashboardMetrics = {
            ...metrics,
            totalFlags: event.is_suspicious ? metrics.totalFlags + 1 : metrics.totalFlags,
            highSeverityCount:
                event.severity === 'high'
                    ? metrics.highSeverityCount + 1
                    : metrics.highSeverityCount,
        }

        set({
            liveEvents: updatedFeed,
            seenEventIds: newSeen,
            metrics: updatedMetrics,
        })

        // Clear the isNew flag after the animation window
        setTimeout(() => {
            set((s) => ({
                liveEvents: s.liveEvents.map((e) =>
                    e.id === event.id ? { ...e, isNew: false } : e
                ),
            }))
        }, 1500)
    },

    markEventSeen: (id) => {
        set((s) => {
            const newSeen = new Set(s.seenEventIds)
            newSeen.add(id)
            return { seenEventIds: newSeen }
        })
    },

    updateRiskScore: (sessionId, score) => {
        set((s) => ({
            metrics: {
                ...s.metrics,
                riskScores: { ...s.metrics.riskScores, [sessionId]: score },
            },
        }))
    },

    incrementActiveSessions: () => {
        set((s) => ({
            metrics: { ...s.metrics, activeSessions: s.metrics.activeSessions + 1 },
        }))
    },

    decrementActiveSessions: () => {
        set((s) => ({
            metrics: {
                ...s.metrics,
                activeSessions: Math.max(0, s.metrics.activeSessions - 1),
            },
        }))
    },

    resetFeed: () => {
        set({ liveEvents: [], seenEventIds: new Set(), metrics: defaultMetrics })
    },
}))
