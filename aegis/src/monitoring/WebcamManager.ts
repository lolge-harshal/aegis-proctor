/**
 * WebcamManager — owns the MediaStream lifecycle.
 *
 * Responsibilities:
 *  - Request camera permission
 *  - Provide a stable HTMLVideoElement with the stream attached
 *  - Stop all tracks on cleanup
 *
 * No React, no hooks — plain class.
 */
export class WebcamManager {
    private stream: MediaStream | null = null
    private videoEl: HTMLVideoElement | null = null

    /**
     * Start the webcam and return a ready-to-use <video> element.
     * The element is created internally so the engine can draw frames
     * without needing a DOM reference from the component.
     *
     * @param constraints  Optional MediaStreamConstraints override.
     */
    async start(
        constraints: MediaStreamConstraints = {
            video: { width: 640, height: 480, facingMode: 'user' },
            audio: false,
        }
    ): Promise<HTMLVideoElement> {
        if (this.stream) {
            // Already running — return existing element
            return this.videoEl!
        }

        this.stream = await navigator.mediaDevices.getUserMedia(constraints)

        const video = document.createElement('video')
        video.srcObject = this.stream
        video.muted = true
        video.playsInline = true

        await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => {
                video.play().then(resolve).catch(reject)
            }
            video.onerror = reject
        })

        this.videoEl = video
        return video
    }

    /**
     * Attach the internal stream to an external <video> element for preview.
     * Call this from a React ref callback after `start()`.
     */
    attachPreview(previewEl: HTMLVideoElement): void {
        if (!this.stream) return
        previewEl.srcObject = this.stream
        previewEl.muted = true
        previewEl.playsInline = true
        previewEl.play().catch(() => {/* autoplay policy — user gesture required */ })
    }

    /** Detach stream from a preview element without stopping the stream. */
    detachPreview(previewEl: HTMLVideoElement): void {
        previewEl.srcObject = null
    }

    /** Stop all tracks and release the stream. */
    stop(): void {
        this.stream?.getTracks().forEach((t) => t.stop())
        this.stream = null

        if (this.videoEl) {
            this.videoEl.srcObject = null
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
