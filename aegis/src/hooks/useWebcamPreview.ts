import { useEffect, useRef, useCallback } from 'react'

/**
 * useWebcamPreview — attaches a MediaStream to a <video> element.
 *
 * Use this when you need a standalone webcam preview without the full
 * monitoring engine (e.g. a "camera check" screen before the session starts).
 *
 * For in-session preview, use `attachPreview` from `useMonitoring` instead —
 * it reuses the engine's existing stream.
 *
 * @example
 * const { videoRef, isReady, error } = useWebcamPreview()
 * return <video ref={videoRef} autoPlay muted playsInline />
 */
export function useWebcamPreview() {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [isReady, setIsReady] = useStateRef(false)
    const [error, setError] = useStateRef<string | null>(null)

    useEffect(() => {
        let cancelled = false

        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: 'user' }, audio: false })
            .then((stream) => {
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop())
                    return
                }
                streamRef.current = stream
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    videoRef.current.play().catch(() => {/* autoplay policy */ })
                }
                setIsReady(true)
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message)
            })

        return () => {
            cancelled = true
            streamRef.current?.getTracks().forEach((t) => t.stop())
            streamRef.current = null
            if (videoRef.current) videoRef.current.srcObject = null
            setIsReady(false)
            setError(null)
        }
    }, [])

    const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
        videoRef.current = el
        // If stream is already running when the ref is set (e.g. Strict Mode remount)
        if (el && streamRef.current) {
            el.srcObject = streamRef.current
            el.play().catch(() => { })
        }
    }, [])

    return { videoRef: setVideoRef, isReady: isReady.current, error: error.current }
}

// ---------------------------------------------------------------------------
// Minimal useState-like ref pair to avoid re-renders from this hook
// ---------------------------------------------------------------------------
function useStateRef<T>(initial: T) {
    const ref = useRef<T>(initial)
    const set = useCallback((val: T) => { ref.current = val }, [])
    return [ref, set] as const
}
