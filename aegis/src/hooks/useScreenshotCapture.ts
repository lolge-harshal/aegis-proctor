/**
 * useScreenshotCapture — captures a webcam frame on suspicious events,
 * compresses it, uploads to Supabase Storage, and links it to the event.
 *
 * Design goals:
 *  - Lightweight: uses an off-screen canvas, no extra libraries
 *  - Non-blocking: all work is async, never freezes the UI
 *  - Cooldown: prevents upload spam (one screenshot per event type per window)
 *  - Graceful failure: upload errors are logged but never crash the session
 *  - Object URL cleanup: any temporary blob URLs are revoked after use
 */

import { useRef, useCallback } from 'react'
import { uploadScreenshot } from '@/services/supabase'
import type { EventType } from '@/services/supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScreenshotCaptureOptions {
    /** JPEG quality 0–1. Default: 0.6 (good balance for demo) */
    quality?: number
    /** Max width to resize to before upload. Default: 640 */
    maxWidth?: number
    /** Max height to resize to before upload. Default: 480 */
    maxHeight?: number
    /** Per-event-type cooldown in ms. Default: 15_000 (15 s) */
    cooldownMs?: number
    /** Called after a successful upload with the signed URL */
    onSuccess?: (params: ScreenshotResult) => void
    /** Called when capture or upload fails */
    onError?: (err: unknown) => void
}

export interface ScreenshotResult {
    sessionId: string
    eventId: string
    eventType: EventType
    imageUrl: string
    storagePath: string
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useScreenshotCapture(options: ScreenshotCaptureOptions = {}) {
    const {
        quality = 0.6,
        maxWidth = 640,
        maxHeight = 480,
        cooldownMs = 15_000,
        onSuccess,
        onError,
    } = options

    // Track last capture time per event type to enforce cooldowns
    const lastCaptureRef = useRef<Partial<Record<EventType, number>>>({})

    // Off-screen canvas reused across captures (created lazily)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const getCanvas = useCallback((): HTMLCanvasElement => {
        if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas')
        }
        return canvasRef.current
    }, [])

    /**
     * Capture a frame from the given video element, compress it, and upload.
     * Returns the signed URL on success, or null on cooldown / failure.
     *
     * @param videoEl  - The live webcam <video> element to snapshot
     * @param sessionId - Active session ID (used as storage folder)
     * @param eventId   - The monitoring_events row ID to link the screenshot to
     * @param eventType - Used for per-type cooldown tracking
     */
    const captureAndUpload = useCallback(
        async (
            videoEl: HTMLVideoElement | null,
            sessionId: string,
            eventId: string,
            eventType: EventType,
        ): Promise<string | null> => {
            // ── Cooldown check ────────────────────────────────────────────────
            const now = Date.now()
            const lastCapture = lastCaptureRef.current[eventType] ?? 0
            if (now - lastCapture < cooldownMs) {
                return null
            }
            lastCaptureRef.current[eventType] = now

            // ── Validate video element ────────────────────────────────────────
            if (!videoEl) {
                console.warn('[useScreenshotCapture] No video element available')
                return null
            }
            if (videoEl.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
                console.warn('[useScreenshotCapture] Video not ready, readyState:', videoEl.readyState)
                return null
            }
            if (videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
                console.warn('[useScreenshotCapture] Video has zero dimensions:', videoEl.videoWidth, 'x', videoEl.videoHeight)
                return null
            }

            try {
                // ── Capture frame to canvas ───────────────────────────────────
                const canvas = getCanvas()

                const srcW = videoEl.videoWidth
                const srcH = videoEl.videoHeight
                const scale = Math.min(maxWidth / srcW, maxHeight / srcH, 1)
                canvas.width = Math.round(srcW * scale)
                canvas.height = Math.round(srcH * scale)

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    console.warn('[useScreenshotCapture] Could not get 2D canvas context')
                    return null
                }

                ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)

                // ── Compress to JPEG blob ─────────────────────────────────────
                const blob = await new Promise<Blob | null>((resolve) => {
                    canvas.toBlob(resolve, 'image/jpeg', quality)
                })

                if (!blob) {
                    console.warn('[useScreenshotCapture] canvas.toBlob returned null')
                    return null
                }

                // ── Upload to Supabase Storage ────────────────────────────────
                const { imageUrl, storagePath } = await uploadScreenshot(
                    sessionId,
                    blob,
                    eventId,
                )

                onSuccess?.({ sessionId, eventId, eventType, imageUrl, storagePath })
                return imageUrl
            } catch (err) {
                console.error('[useScreenshotCapture] Failed to capture/upload screenshot:', err)
                onError?.(err)
                return null
            }
        },
        [quality, maxWidth, maxHeight, cooldownMs, getCanvas, onSuccess, onError],
    )

    /**
     * Reset cooldowns — call when a session ends so the next session
     * starts with a clean slate.
     */
    const resetCooldowns = useCallback(() => {
        lastCaptureRef.current = {}
    }, [])

    /**
     * Cleanup the off-screen canvas. Call on component unmount if needed.
     */
    const cleanup = useCallback(() => {
        canvasRef.current = null
        lastCaptureRef.current = {}
    }, [])

    return { captureAndUpload, resetCooldowns, cleanup }
}
