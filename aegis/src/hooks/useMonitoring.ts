import { useEffect, useRef, useCallback, useState } from 'react'
import { DetectionEngine } from '@/monitoring/DetectionEngine'
import { EventDispatcher } from '@/monitoring/EventDispatcher'
import { recordDetection } from '@/services/supabase'
import { supabase } from '@/services/supabase/client'
import { useScreenshotCapture } from './useScreenshotCapture'
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
    /**
     * Call this with the preview <video> element ref.
     * Safe to call before or after startMonitoring — the element is stored
     * and attached as soon as the engine (and its stream) is ready.
     */
    attachPreview: (el: HTMLVideoElement | null) => void
}

export function useMonitoring({
    onEvent,
    onStatusChange,
    config,
}: UseMonitoringOptions = {}): UseMonitoringResult {
    const dispatcherRef = useRef<EventDispatcher>(new EventDispatcher())
    const engineRef = useRef<DetectionEngine | null>(null)

    // Store the preview element so we can attach it as soon as the engine is ready,
    // regardless of which happens first (ref callback vs engine start completing).
    const previewElRef = useRef<HTMLVideoElement | null>(null)

    const [engineStatus, setEngineStatus] = useState<EngineStatus>({ state: 'idle' })
    const [latestFrame, setLatestFrame] = useState<FaceFrame | null>(null)

    const onEventRef = useRef(onEvent)
    const onStatusChangeRef = useRef(onStatusChange)
    onEventRef.current = onEvent
    onStatusChangeRef.current = onStatusChange

    // ── Screenshot capture ───────────────────────────────────────────────────
    const { captureAndUpload, resetCooldowns, cleanup: cleanupScreenshots } = useScreenshotCapture({
        quality: 0.6,
        maxWidth: 640,
        maxHeight: 480,
        cooldownMs: 15_000,
        onError: (err) => {
            console.warn('[useMonitoring] Screenshot capture failed (non-fatal):', err)
        },
    })

    // ── Wire dispatcher → React state (once on mount, cleanup on unmount) ───
    useEffect(() => {
        const dispatcher = dispatcherRef.current

        const unsubStatus = dispatcher.on('status-change', (status) => {
            setEngineStatus(status)
            onStatusChangeRef.current?.(status)

            // When the engine transitions to 'running', the webcam stream is live.
            // If a preview element was registered before the engine was ready, attach it now.
            if (status.state === 'running' && previewElRef.current && engineRef.current) {
                engineRef.current.webcam.attachPreview(previewElRef.current)
            }
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
            })
                .then(async (row) => {
                    // Only capture screenshots for medium/high severity events
                    if (event.severity === 'medium' || event.severity === 'high') {
                        // Prefer the off-screen detection video element (always playing).
                        // Fall back to the registered preview element if needed.
                        const videoEl =
                            engineRef.current?.webcam.videoElement ??
                            previewElRef.current ??
                            null

                        const imageUrl = await captureAndUpload(
                            videoEl,
                            event.sessionId,
                            row.id,
                            event.eventType,
                        )

                        if (imageUrl) {
                            supabase
                                .from('monitoring_events')
                                .update({ screenshot_url: imageUrl })
                                .eq('id', row.id)
                                .then(({ error }) => {
                                    if (error) {
                                        console.warn('[useMonitoring] Failed to patch screenshot_url:', error)
                                    }
                                })
                        }
                    }
                })
                .catch((err) => {
                    console.warn('[useMonitoring] Failed to record event:', err)
                })

            onEventRef.current?.(event)
        })

        return () => {
            unsubStatus()
            unsubFrame()
            unsubEvent()
            engineRef.current?.stop()
            engineRef.current = null
            cleanupScreenshots()
        }
    }, [captureAndUpload, cleanupScreenshots])

    // ── Public API ───────────────────────────────────────────────────────────

    const startMonitoring = useCallback(async (sessionId: string) => {
        if (engineRef.current) {
            engineRef.current.stop()
            engineRef.current = null
        }

        resetCooldowns()

        const engine = new DetectionEngine(
            sessionId,
            dispatcherRef.current,
            config ?? {}
        )
        engineRef.current = engine
        await engine.start()

        // After the engine starts, the webcam stream is guaranteed to be live.
        // Attach the preview element if one was registered (handles the case where
        // the <video> ref callback fired before startMonitoring completed).
        if (previewElRef.current) {
            engine.webcam.attachPreview(previewElRef.current)
        }
    }, [config, resetCooldowns])

    const stopMonitoring = useCallback(() => {
        engineRef.current?.stop()
        engineRef.current = null
        resetCooldowns()
    }, [resetCooldowns])

    /**
     * Register the preview <video> element. Can be called at any time:
     * - If the engine is already running, attaches immediately.
     * - If the engine hasn't started yet, stores the element and attaches
     *   once the engine transitions to 'running'.
     */
    const attachPreview = useCallback((el: HTMLVideoElement | null) => {
        previewElRef.current = el
        if (!el) return

        // If the engine is already running and has a stream, attach right away
        if (engineRef.current?.webcam.isRunning) {
            engineRef.current.webcam.attachPreview(el)
        }
        // Otherwise it will be attached in startMonitoring() or the status-change listener
    }, [])

    return { startMonitoring, stopMonitoring, engineStatus, latestFrame, attachPreview }
}
