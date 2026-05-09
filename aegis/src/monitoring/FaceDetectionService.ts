import {
    FaceLandmarker,
    FilesetResolver,
    type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision'
import type { FaceFrame } from './types'

/**
 * FaceDetectionService — thin wrapper around MediaPipe FaceLandmarker.
 *
 * Responsibilities:
 *  - Lazy-load the WASM + model (only once, cached)
 *  - Run inference on a single video frame
 *  - Convert raw landmarks → FaceFrame (faceCount + head pose)
 *
 * Head pose is estimated from the 3D face mesh using the nose tip (1),
 * left eye outer corner (33), right eye outer corner (263), and chin (152).
 * This is a lightweight heuristic — accurate enough for proctoring.
 */
export class FaceDetectionService {
    private landmarker: FaceLandmarker | null = null
    private initPromise: Promise<void> | null = null

    // MediaPipe CDN — avoids bundling the large WASM binary
    private static readonly WASM_URL =
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    private static readonly MODEL_URL =
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

    /**
     * Initialize the landmarker. Safe to call multiple times — returns the
     * same promise if already in progress.
     */
    async init(): Promise<void> {
        if (this.landmarker) return
        if (this.initPromise) return this.initPromise

        this.initPromise = (async () => {
            const vision = await FilesetResolver.forVisionTasks(
                FaceDetectionService.WASM_URL
            )
            this.landmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: FaceDetectionService.MODEL_URL,
                    delegate: 'GPU',
                },
                runningMode: 'VIDEO',
                numFaces: 4,           // detect up to 4 faces
                minFaceDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
                outputFaceBlendshapes: false,
                outputFacialTransformationMatrixes: true,
            })
        })()

        return this.initPromise
    }

    /**
     * Run inference on the current video frame.
     * Must be called after `init()` resolves.
     * Returns null if the landmarker isn't ready.
     */
    detect(video: HTMLVideoElement, timestampMs: number): FaceFrame | null {
        if (!this.landmarker || video.readyState < 2) return null

        let result: FaceLandmarkerResult
        try {
            result = this.landmarker.detectForVideo(video, timestampMs)
        } catch {
            // Frame skipped (e.g. video not ready)
            return null
        }

        const faceCount = result.faceLandmarks.length
        const confidence =
            faceCount > 0
                ? (result.faceBlendshapes?.[0]?.categories?.[0]?.score ?? 0.8)
                : 0

        const headPose = faceCount > 0
            ? this.estimateHeadPose(result)
            : null

        return { faceCount, headPose, detectionConfidence: confidence }
    }

    /**
     * Estimate head pose from the facial transformation matrix when available,
     * falling back to a landmark-based heuristic.
     */
    private estimateHeadPose(result: FaceLandmarkerResult): FaceFrame['headPose'] {
        // Prefer the transformation matrix (more accurate)
        const matrix = result.facialTransformationMatrixes?.[0]?.data
        if (matrix && matrix.length === 16) {
            return this.poseFromMatrix(matrix)
        }

        // Fallback: landmark geometry heuristic
        const lm = result.faceLandmarks[0]
        if (!lm || lm.length < 468) return { yaw: 0, pitch: 0, roll: 0 }
        return this.poseFromLandmarks(lm)
    }

    /**
     * Extract Euler angles from a 4×4 column-major rotation matrix.
     * MediaPipe returns the matrix in column-major order.
     */
    private poseFromMatrix(m: Float32Array | number[]): FaceFrame['headPose'] {
        // Column-major: m[row + col*4]
        const r00 = m[0], r10 = m[1], r20 = m[2]
        const r21 = m[6]
        const r22 = m[10]

        const pitch = Math.atan2(-r20, Math.sqrt(r00 * r00 + r10 * r10))
        const yaw = Math.atan2(r10, r00)
        const roll = Math.atan2(r21, r22)

        const toDeg = (r: number) => (r * 180) / Math.PI
        return { yaw: toDeg(yaw), pitch: toDeg(pitch), roll: toDeg(roll) }
    }

    /**
     * Landmark-based heuristic using nose tip, eye corners, and chin.
     * Less accurate than the matrix but works without transformation output.
     */
    private poseFromLandmarks(
        lm: Array<{ x: number; y: number; z: number }>
    ): FaceFrame['headPose'] {
        const noseTip = lm[1]
        const leftEye = lm[33]
        const rightEye = lm[263]
        const chin = lm[152]
        const forehead = lm[10]

        if (!noseTip || !leftEye || !rightEye || !chin || !forehead) {
            return { yaw: 0, pitch: 0, roll: 0 }
        }

        // Yaw: horizontal offset of nose from eye midpoint
        const eyeMidX = (leftEye.x + rightEye.x) / 2
        const yawRaw = (noseTip.x - eyeMidX) / (rightEye.x - leftEye.x + 1e-6)
        const yaw = yawRaw * 90 // scale to ~degrees

        // Pitch: vertical offset of nose from chin/forehead midpoint
        const vertMid = (chin.y + forehead.y) / 2
        const pitchRaw = (noseTip.y - vertMid) / (chin.y - forehead.y + 1e-6)
        const pitch = pitchRaw * 60

        // Roll: angle of the eye line
        const dy = rightEye.y - leftEye.y
        const dx = rightEye.x - leftEye.x
        const roll = Math.atan2(dy, dx) * (180 / Math.PI)

        return { yaw, pitch, roll }
    }

    get isReady(): boolean {
        return this.landmarker !== null
    }

    /** Release the landmarker and free WASM memory. */
    destroy(): void {
        this.landmarker?.close()
        this.landmarker = null
        this.initPromise = null
    }
}
