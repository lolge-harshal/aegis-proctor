import { useEffect, useRef, useCallback, useState } from 'react'
import { DetectionEngine } from '@/monitoring/DetectionEngine'
import { EventDispatcher } from '@/monitoring/EventDispatcher'
import { recordDetection } from '@/services/supabase'
import type { MonitoringEvent, EngineStatus, FaceFrame, MonitoringConfig } from '@/monitoring/types'

interface UseMonitoringOptions {
    sessionId: string | null
    /** Called for every dispatched event (after Supabase write). */
    onEvent?: (event: MonitoringEvent) => void
    /** Called when engine status changes. */
    onStatusChange?: (status: EngineStatus) => void
    config?: Partial<MonitoringConfig>
}

interface UseMonitoringResult {
    /** Start the engine — requests camera, loads model, begins detection. */
    startMonitoring: () => Promise<void>
    /** Stop the engine and release all resources. */
    stopMonitoring: () => void
    engineStatus: EngineStatus
    /** Latest face frame — useful for a live head-pose overlay. */
    latestFrame: FaceFrame | null
    /** Attach the webcam stream to a <video> element for preview. */
    attachPreview: (el: HTMLVideoElement | null) => void
}

/**
 * useMonitoring — the primary React integration hook for the detection engine.
 *
 * Lifecycle:
 *  - Creates a DetectionEngine + EventDispatcher on mount (stable refs).
 *  - `startMonitoring()` starts the engine when the session is live.
 *  - Engine events are written to Supabase via `recordDetection`.
 *  - Everything is cleaned up on unmount or when `stopMonitoring()` is called.
 *
 * @example
 * const { startMonitoring, stopMonitoring, attachPreview, engineStatus } =
 *   useMonitoring({ sessionId, onEvent: (e) => console.log(e) })
 */
export function useMonitoring({
    sessionId,
    onEvent,
    onStatusChange,
    config,
}: UseMonitoringOptions): UseMonitoringResult {
    const dispatcherRef = useRef<EventDispatcher | null>(null)
    const engineRef = useRef<DetectionEngine | null>(null)

    const [engineStatus, setEngineStatus] = useState<EngineStatus>({ state: 'idle' })
    const [latestFrame, setLatestFrame] = useState<FaceFrame | null>(null)

    // Stable callback refs — avoids re-subscribing on every render
    const onEventRef = useRef(onEvent)
    const onStatusChangeRef = useRef(onStatusChange)
    useEffect(() => { onEventRef.current = onEvent }, [onEvent])
    useEffect(() => { onStatusChangeRef.current = onStatusChange }, [onStatusChange])

    // ── Create dispatcher + engine once per sessionId ────────────────────────
    useEffect(() => {
        if (!sessionId) return

        const dispatcher = new EventDispatcher()
        const engine = new DetectionEngine(sessionId, dispatcher, config)

        dispatcherRef.current = dispatcher
        engineRef.current = engine

        // Subscribe: status changes
        const unsubStatus = dispatcher.on('status-change', (status) => {
            setEngineStatus(status)
            onStatusChangeRef.current?.(status)
        })

        // Subscribe: face frames (for UI overlay)
        const unsubFrame = dispatcher.on('frame', (frame) => {
            setLatestFrame(frame)
        })

        // Subscribe: detection events → Supabase + caller callback
        const unsubEvent = dispatcher.on('event', (event) => {
            // Fire-and-forget write to Supabase
            recordDetection({
                sessionId: event.sessionId,
                eventType: event.eventType,
                severity: event.severity,
                confidenceScore: event.confidence,
                snapshot: event.snapshot,
                isSuspicious: true,
            }).catch((err) => {
                console.warn('[useMonitoring] Failed to record event:', err)
            })

            onEventRef.current?.(event)
        })

        return () => {
            unsubStatus()
            unsubFrame()
            unsubEvent()
            engine.stop()
            dispatcher.clear()
            dispatcherRef.current = null
            engineRef.current = null
        }
        // config is intentionally excluded — changing config mid-session
        // would require a full engine restart; handle that at the call site.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId])

    // ── Public API ───────────────────────────────────────────────────────────

    const startMonitoring = useCallback(async () => {
        if (!engineRef.current) {
            throw new Error('Engine not ready — sessionId may be null')
        }
        await engineRef.current.start()
    }, [])

    const stopMonitoring = useCallback(() => {
        engineRef.current?.stop()
    }, [])

    const attachPreview = useCallback((el: HTMLVideoElement | null) => {
        if (!el || !engineRef.current) return
        engineRef.current.webcam.attachPreview(el)
    }, [])

    return { startMonitoring, stopMonitoring, engineStatus, latestFrame, attachPreview }
}
