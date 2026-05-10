/**
 * Monitoring engine — shared types.
 * All detection logic is outside React; these types are the contract
 * between the engine, the event dispatcher, and the UI hooks.
 */

import type { EventType, EventSeverity, EventSnapshot } from '@/services/supabase'

// ---------------------------------------------------------------------------
// Re-export DB enums so the engine never imports from supabase directly
// ---------------------------------------------------------------------------
export type { EventType, EventSeverity, EventSnapshot }

// ---------------------------------------------------------------------------
// A detection result produced by a rule
// ---------------------------------------------------------------------------
export interface DetectionResult {
    eventType: EventType
    severity: EventSeverity
    /** 0–1 confidence from the model or heuristic */
    confidence: number
    snapshot: Omit<EventSnapshot, 'timestamp'>
}

// ---------------------------------------------------------------------------
// A fully-formed engine event (result + metadata)
// ---------------------------------------------------------------------------
export interface MonitoringEvent {
    id: string                // crypto.randomUUID()
    sessionId: string
    eventType: EventType
    severity: EventSeverity
    confidence: number
    snapshot: EventSnapshot   // includes timestamp
    detectedAt: number        // Date.now()
}

// ---------------------------------------------------------------------------
// Face detection frame data passed to rules
// ---------------------------------------------------------------------------
export interface FaceFrame {
    /** Number of faces detected in this frame */
    faceCount: number
    /**
     * Head pose for the primary face (index 0).
     * Derived from MediaPipe FaceLandmarker keypoints.
     * All angles in degrees.
     */
    headPose: {
        yaw: number    // left/right rotation  (negative = left)
        pitch: number  // up/down tilt         (negative = down)
        roll: number   // head tilt
    } | null
    /** Raw confidence from the detector (0–1) */
    detectionConfidence: number
}

// ---------------------------------------------------------------------------
// Engine lifecycle state
// ---------------------------------------------------------------------------
export type EngineState = 'idle' | 'initializing' | 'running' | 'stopped' | 'error'

export interface EngineStatus {
    state: EngineState
    error?: string
    fps?: number
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
export interface MonitoringConfig {
    /** Target detection loop interval in ms. Default: 500 (2 fps) */
    detectionIntervalMs: number
    /** Cooldown per event type in ms — prevents spam */
    cooldowns: Record<EventType, number>
    /** Head yaw threshold (degrees) beyond which "looking away" fires */
    lookAwayYawThreshold: number
    /** Head pitch threshold (degrees) */
    lookAwayPitchThreshold: number
    /** Consecutive frames needed before firing a face event */
    faceEventFrameThreshold: number
}

export const DEFAULT_CONFIG: MonitoringConfig = {
    detectionIntervalMs: 500,
    cooldowns: {
        no_face: 8_000,
        multiple_faces: 8_000,
        looking_away: 6_000,
        tab_switch: 3_000,
        fullscreen_exit: 3_000,
    },
    lookAwayYawThreshold: 25,
    lookAwayPitchThreshold: 20,
    faceEventFrameThreshold: 2,
}

// ---------------------------------------------------------------------------
// EventDispatcher typed event map
// ---------------------------------------------------------------------------
export interface EngineEventMap {
    'event': MonitoringEvent
    'status-change': EngineStatus
    'frame': FaceFrame | null
}

export type EngineEventType = keyof EngineEventMap
export type EngineListener<K extends EngineEventType> = (payload: EngineEventMap[K]) => void
