import { useEffect, useRef, useCallback, useState } from 'react'
import { DetectionEngine } from '@/monitoring/DetectionEngine'
import { EventDispatcher } from '@/monitoring/EventDispatcher'
import { recordDetection } from '@/services/supabase'
import type { MonitoringEvent, EngineStatus, FaceFrame, MonitoringConfig } from '@/monitoring/types'

interface UseMonitoringOptions {
    onEvent?: (event: MonitoringEvent) => void
    onStatusChange?: (status: EngineStatus) => void
    config?: Partial<MonitoringConfig>
}

interface UseMonitoringResult {
    startMonitoring: (sessionId: string) => Promise<void>
    stopMonitoring: () => void
    engineStatus: EngineStatus
    latestFrame: FaceFrame | null
    attachPreview: (el: HTMLVideoElement | null) => void
}

export function useMonitoring({
    onEvent,
    onStatusChange,
    config,
}: UseMonitoringOptions = {}): UseMonitoringResult {
    // ── Create dispatcher ONCE via useRef initializer ────────────────────────
    // useRef(() => ...) runs the factory exactly once per component instance,
    // synchronously, before any render. It is NOT affected by React Strict Mode
    // double-invocation (which only affects useEffect). This guarantees
    // dispatcherRef.current is always non-null when startMonitoring is called.
    const dispatcherRef = useRef<EventDispatcher>(new EventDispatcher())
    const engineRef = useRef<DetectionEngine | null>(null)

    const [engineStatus, setEngineStatus] = useState<EngineStatus>({ state: 'idle' })
    const [latestFrame, setLatestFrame] = useState<FaceFrame | null>(null)

    // Stable callback refs so subscriptions never need to be re-registered
    const onEventRef = useRef(onEvent)
    const onStatusChangeRef = useRef(onStatusChange)
    onEventRef.current = onEvent
    onStatusChangeRef.current = onStatusChange

    // ── Wire dispatcher → React state (once on mount, cleanup on unmount) ───
    useEffect(() => {
        const dispatcher = dispatcherRef.current

        const unsubStatus = dispatcher.on('status-change', (status) => {
            setEngineStatus(status)
            onStatusChangeRef.current?.(status)
        })

        const unsubFrame = dispatcher.on('frame', (frame) => {
            setLatestFrame(frame)
        })

        const unsubEvent = dispatcher.on('event', (event) => {
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
            // Stop engine on unmount — dispatcher itself lives as long as the ref
            engineRef.current?.stop()
            engineRef.current = null
        }
    }, []) // mount/unmount only — dispatcher ref is stable

    // ── Public API ───────────────────────────────────────────────────────────

    const startMonitoring = useCallback(async (sessionId: string) => {
        // Stop any previous engine cleanly
        if (engineRef.current) {
            engineRef.current.stop()
            engineRef.current = null
        }

        const engine = new DetectionEngine(
            sessionId,
            dispatcherRef.current,
            config ?? {}
        )
        engineRef.current = engine
        await engine.start()
    }, [config])

    const stopMonitoring = useCallback(() => {
        engineRef.current?.stop()
        engineRef.current = null
    }, [])

    const attachPreview = useCallback((el: HTMLVideoElement | null) => {
        if (!el) return
        engineRef.current?.webcam.attachPreview(el)
    }, [])

    return { startMonitoring, stopMonitoring, engineStatus, latestFrame, attachPreview }
}
