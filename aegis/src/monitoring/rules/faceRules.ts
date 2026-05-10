import type { FaceFrame, DetectionResult, MonitoringConfig } from '../types'

/**
 * Face-based detection rules.
 *
 * Each function is pure: given a FaceFrame and config, return a
 * DetectionResult or null. No side effects, no state.
 * Stateful concerns (cooldowns, consecutive-frame counters) live in
 * DetectionEngine, not here.
 */

// ---------------------------------------------------------------------------
// no_face
// ---------------------------------------------------------------------------

/**
 * Fires when no face is detected in the frame.
 * Severity: high — candidate may have left the screen.
 */
export function checkNoFace(frame: FaceFrame): DetectionResult | null {
    if (frame.faceCount > 0) return null

    return {
        eventType: 'no_face',
        severity: 'high',
        confidence: 1 - frame.detectionConfidence, // inverse: high when model is confident there's nothing
        snapshot: {
            faceCount: 0,
            detectionConfidence: frame.detectionConfidence,
        },
    }
}

// ---------------------------------------------------------------------------
// multiple_faces
// ---------------------------------------------------------------------------

/**
 * Fires when more than one face is detected.
 * Severity: high — possible impersonation or assistance.
 */
export function checkMultipleFaces(frame: FaceFrame): DetectionResult | null {
    if (frame.faceCount <= 1) return null

    return {
        eventType: 'multiple_faces',
        severity: 'high',
        confidence: Math.min(frame.detectionConfidence + 0.1, 1),
        snapshot: {
            faceCount: frame.faceCount,
            detectionConfidence: frame.detectionConfidence,
        },
    }
}

// ---------------------------------------------------------------------------
// looking_away
// ---------------------------------------------------------------------------

/**
 * Fires when the primary face's head pose exceeds the configured thresholds.
 * Severity: medium — candidate may be reading notes or looking at another screen.
 */
export function checkLookingAway(
    frame: FaceFrame,
    config: Pick<MonitoringConfig, 'lookAwayYawThreshold' | 'lookAwayPitchThreshold'>
): DetectionResult | null {
    if (frame.faceCount === 0 || !frame.headPose) return null

    const { yaw, pitch } = frame.headPose
    const yawExceeded = Math.abs(yaw) > config.lookAwayYawThreshold
    const pitchExceeded = Math.abs(pitch) > config.lookAwayPitchThreshold

    if (!yawExceeded && !pitchExceeded) return null

    // Confidence scales with how far past the threshold the angle is
    const yawRatio = Math.abs(yaw) / config.lookAwayYawThreshold
    const pitchRatio = Math.abs(pitch) / config.lookAwayPitchThreshold
    const confidence = Math.min(Math.max(yawRatio, pitchRatio) * 0.6, 1)

    return {
        eventType: 'looking_away',
        severity: 'medium',
        confidence,
        snapshot: {
            faceCount: frame.faceCount,
            attentionScore: 1 - confidence,
            headPose: frame.headPose,
            detectionConfidence: frame.detectionConfidence,
        },
    }
}
