import { CooldownManager } from './CooldownManager'
import { EventDispatcher } from './EventDispatcher'
import { FaceDetectionService } from './FaceDetectionService'
import { WebcamManager } from './WebcamManager'
import { checkNoFace, checkMultipleFaces, checkLookingAway } from './rules/faceRules'
import { checkTabSwitch } from './rules/tabRules'
import { checkFullscreenExit } from './rules/fullscreenRules'
import type {
    MonitoringConfig,
    DetectionResult,
    MonitoringEvent,
    EngineState,
    FaceFrame,
} from './types'
import { DEFAULT_CONFIG } from './types'

/**
 * DetectionEngine — the central orchestrator.
 *
 * Owns:
 *  - The detection loop (setInterval, not rAF — more predictable cadence)
 *  - Consecutive-frame counters for face events (debounce single-frame glitches)
 *  - DOM event listeners for tab/fullscreen
 *  - Wiring between WebcamManager, FaceDetectionService, rules, CooldownManager,
 *    and EventDispatcher
 *
 * Usage:
 *   const engine = new DetectionEngine(sessionId, dispatcher, config)
 *   await engine.start()
 *   // ... session runs ...
 *   engine.stop()
 */
export class DetectionEngine {
    private readonly sessionId: string
    private readonly dispatcher: EventDispatcher
    private readonly config: MonitoringConfig
    private readonly cooldown: CooldownManager
    private readonly faceService: FaceDetectionService
    readonly webcam: WebcamManager

    private intervalId: ReturnType<typeof setInterval> | null = null
    private state: EngineState = 'idle'

    // Consecutive-frame counters — prevents single-frame glitches from firing
    private noFaceFrames = 0
    private multiFaceFrames = 0
    private lookAwayFrames = 0

    // Bound DOM listeners (stored so we can remove them)
    private readonly onVisibilityChange: () => void
    private readonly onFullscreenChange: () => void

    constructor(
        sessionId: string,
        dispatcher: EventDispatcher,
        config: Partial<MonitoringConfig> = {}
    ) {
        this.sessionId = sessionId
        this.dispatcher = dispatcher
        this.config = { ...DEFAULT_CONFIG, ...config }
        this.cooldown = new CooldownManager(this.config.cooldowns)
        this.faceService = new FaceDetectionService()
        this.webcam = new WebcamManager()

        // Bind DOM listeners once so we can remove them later
        this.onVisibilityChange = () => this.handleTabSwitch()
        this.onFullscreenChange = () => this.handleFullscreenChange()
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    async start(): Promise<void> {
        if (this.state === 'running') return
        this.setState('initializing')

        try {
            // 1. Start webcam
            await this.webcam.start()

            // 2. Load MediaPipe model
            await this.faceService.init()

            // 3. Attach DOM event listeners
            document.addEventListener('visibilitychange', this.onVisibilityChange)
            document.addEventListener('fullscreenchange', this.onFullscreenChange)
            document.addEventListener('webkitfullscreenchange', this.onFullscreenChange)

            // 4. Start detection loop
            this.intervalId = setInterval(
                () => this.runDetectionFrame(),
                this.config.detectionIntervalMs
            )

            this.setState('running')
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Engine failed to start'
            this.setState('error', message)
            this.cleanup()
            throw err
        }
    }

    stop(): void {
        if (this.state === 'idle' || this.state === 'stopped') return
        this.cleanup()
        this.setState('stopped')
    }

    // ── Detection loop ───────────────────────────────────────────────────────

    private runDetectionFrame(): void {
        const video = this.webcam.videoElement
        if (!video || !this.faceService.isReady) return

        const frame = this.faceService.detect(video, performance.now())
        if (!frame) return

        // Emit the raw frame for UI preview (webcam overlay, head pose display)
        this.dispatcher.emitFrame(frame)

        this.evaluateFaceRules(frame)
    }

    private evaluateFaceRules(frame: FaceFrame): void {
        const threshold = this.config.faceEventFrameThreshold

        // ── no_face ──────────────────────────────────────────────────────────
        const noFaceResult = checkNoFace(frame)
        if (noFaceResult) {
            this.noFaceFrames++
            if (this.noFaceFrames >= threshold) {
                this.tryDispatch(noFaceResult)
            }
        } else {
            this.noFaceFrames = 0
        }

        // ── multiple_faces ───────────────────────────────────────────────────
        const multiFaceResult = checkMultipleFaces(frame)
        if (multiFaceResult) {
            this.multiFaceFrames++
            if (this.multiFaceFrames >= threshold) {
                this.tryDispatch(multiFaceResult)
            }
        } else {
            this.multiFaceFrames = 0
        }

        // ── looking_away ─────────────────────────────────────────────────────
        const lookAwayResult = checkLookingAway(frame, this.config)
        if (lookAwayResult) {
            this.lookAwayFrames++
            if (this.lookAwayFrames >= threshold) {
                this.tryDispatch(lookAwayResult)
            }
        } else {
            this.lookAwayFrames = 0
        }
    }

    // ── DOM event handlers ───────────────────────────────────────────────────

    private handleTabSwitch(): void {
        const result = checkTabSwitch()
        if (result) this.tryDispatch(result)
    }

    private handleFullscreenChange(): void {
        const result = checkFullscreenExit()
        if (result) this.tryDispatch(result)
    }

    // ── Dispatch ─────────────────────────────────────────────────────────────

    /**
     * Apply cooldown check then emit the event.
     * Returns true if the event was dispatched.
     */
    private tryDispatch(result: DetectionResult): boolean {
        if (!this.cooldown.tryConsume(result.eventType)) return false

        const event: MonitoringEvent = {
            id: crypto.randomUUID(),
            sessionId: this.sessionId,
            eventType: result.eventType,
            severity: result.severity,
            confidence: result.confidence,
            snapshot: {
                ...result.snapshot,
                timestamp: Date.now(),
            },
            detectedAt: Date.now(),
        }

        this.dispatcher.emitEvent(event)
        return true
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private setState(state: EngineState, error?: string): void {
        this.state = state
        this.dispatcher.emitStatus({ state, error })
    }

    private cleanup(): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId)
            this.intervalId = null
        }
        document.removeEventListener('visibilitychange', this.onVisibilityChange)
        document.removeEventListener('fullscreenchange', this.onFullscreenChange)
        document.removeEventListener('webkitfullscreenchange', this.onFullscreenChange)
        this.webcam.stop()
        this.faceService.destroy()
        this.cooldown.reset()
        this.noFaceFrames = 0
        this.multiFaceFrames = 0
        this.lookAwayFrames = 0
    }

    get currentState(): EngineState {
        return this.state
    }
}
