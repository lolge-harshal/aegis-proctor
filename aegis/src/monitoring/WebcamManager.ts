/**
 * WebcamManager — owns the MediaStream lifecycle.
 *
 * Responsibilities:
 *  - Request camera permission
 *  - Provide a stable off-screen HTMLVideoElement for the detection loop
 *  - Share the same stream to any number of preview elements
 *  - Stop all tracks on cleanup
 */
export class WebcamManager {
    private stream: MediaStream | null = null
    private videoEl: HTMLVideoElement | null = null

    /**
     * Start the webcam and return a ready-to-use off-screen <video> element
     * for the detection loop. Safe to call multiple times — returns the
     * existing element if already running.
     */
    async start(
        constraints: MediaStreamConstraints = {
            video: { width: 640, height: 480, facingMode: 'user' },
            audio: false,
        }
    ): Promise<HTMLVideoElement> {
        if (this.stream && this.videoEl) {
            return this.videoEl
        }

        this.stream = await navigator.mediaDevices.getUserMedia(constraints)

        const video = document.createElement('video')
        video.srcObject = this.stream
        video.muted = true
        video.playsInline = true
        // Keep the element off-screen but in a valid state
        video.style.position = 'absolute'
        video.style.width = '1px'
        video.style.height = '1px'
        video.style.opacity = '0'
        video.style.pointerEvents = 'none'
        document.body.appendChild(video)

        await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => {
                video.play().then(resolve).catch(reject)
            }
            video.onerror = () => reject(new Error('Video element error'))
        })

        this.videoEl = video
        return video
    }

    /**
     * Attach the internal stream to an external <video> element for preview.
     * Safe to call before or after start() — if the stream isn't ready yet
     * it's a no-op (the caller should retry after startMonitoring resolves).
     */
    attachPreview(previewEl: HTMLVideoElement): void {
        if (!this.stream) return
        if (previewEl.srcObject === this.stream) return  // already attached

        previewEl.srcObject = this.stream
        previewEl.muted = true
        previewEl.playsInline = true

        // Play — handle autoplay policy gracefully
        const playPromise = previewEl.play()
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Autoplay blocked — the browser will play on next user gesture
            })
        }
    }

    /** Detach stream from a preview element without stopping the stream. */
    detachPreview(previewEl: HTMLVideoElement): void {
        previewEl.srcObject = null
    }

    /** Stop all tracks, remove the off-screen element, and release the stream. */
    stop(): void {
        this.stream?.getTracks().forEach((t) => t.stop())
        this.stream = null

        if (this.videoEl) {
            this.videoEl.srcObject = null
            this.videoEl.remove()
            this.videoEl = null
        }
    }

    get isRunning(): boolean {
        return this.stream !== null
    }

    get videoElement(): HTMLVideoElement | null {
        return this.videoEl
    }

    get mediaStream(): MediaStream | null {
        return this.stream
    }
}
