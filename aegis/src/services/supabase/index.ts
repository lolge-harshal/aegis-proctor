/**
 * Supabase service barrel — import everything from here.
 *
 * @example
 * import { supabase, startSession, recordDetection } from '@/services/supabase'
 */

export { supabase } from './client'

// Auth
export {
    signInWithEmail,
    signUpWithEmail,
    signOut,
    getSession,
    getUser,
    fetchProfile,
    upsertProfile,
    onAuthStateChange,
    sendPasswordResetEmail,
    updatePassword,
} from './auth'

export type { SignUpOptions } from './auth'

// Sessions
export {
    getUserSessions,
    getSession as getExamSession,
    startSession,
    endSession,
    updateSession,
    subscribeToSession,
} from './sessions'

// Monitoring events
export {
    getSessionEvents,
    getSuspiciousEvents,
    getEventsBySeverity,
    recordEvent,
    recordDetection,
    subscribeToEvents,
} from './events'

// Screenshots
export {
    uploadScreenshot,
    refreshSignedUrl,
    getSessionScreenshots,
} from './screenshots'

// Types
export type {
    Database,
    Json,
    ProfileRow,
    ExamSessionRow,
    MonitoringEventRow,
    ScreenshotRow,
    ProfileInsert,
    ExamSessionInsert,
    MonitoringEventInsert,
    ScreenshotInsert,
    ProfileUpdate,
    ExamSessionUpdate,
    MonitoringEventUpdate,
    ScreenshotUpdate,
    SessionStatus,
    EventType,
    EventSeverity,
    UserRole,
    EventSnapshot,
    Tables,
    TablesInsert,
    TablesUpdate,
    Enums,
} from './types'

export { Constants } from './types'
