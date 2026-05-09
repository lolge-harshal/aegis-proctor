/**
 * Monitoring engine barrel.
 * Import everything from here — never import sub-modules directly in components.
 */

export { DetectionEngine } from './DetectionEngine'
export { EventDispatcher } from './EventDispatcher'
export { WebcamManager } from './WebcamManager'
export { FaceDetectionService } from './FaceDetectionService'
export { CooldownManager } from './CooldownManager'

export { checkNoFace, checkMultipleFaces, checkLookingAway } from './rules/faceRules'
export { checkTabSwitch } from './rules/tabRules'
export { checkFullscreenExit, requestFullscreen, isCurrentlyFullscreen } from './rules/fullscreenRules'

export type {
    DetectionResult,
    MonitoringEvent,
    FaceFrame,
    EngineState,
    EngineStatus,
    MonitoringConfig,
    EngineEventMap,
    EngineEventType,
    EngineListener,
} from './types'

export { DEFAULT_CONFIG } from './types'
