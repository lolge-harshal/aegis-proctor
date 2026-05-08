/**
 * Auto-generated Supabase TypeScript types for Aegis Proctoring Platform.
 * Regenerate with: supabase gen types --linked > src/services/supabase/types.ts
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    __InternalSupabase: {
        PostgrestVersion: '14.5'
    }
    public: {
        Tables: {
            exam_sessions: {
                Row: {
                    created_at: string
                    ended_at: string | null
                    fullscreen_violations: number
                    id: string
                    risk_score: number
                    started_at: string | null
                    status: Database['public']['Enums']['session_status']
                    tab_switch_count: number
                    total_warnings: number
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    ended_at?: string | null
                    fullscreen_violations?: number
                    id?: string
                    risk_score?: number
                    started_at?: string | null
                    status?: Database['public']['Enums']['session_status']
                    tab_switch_count?: number
                    total_warnings?: number
                    user_id: string
                }
                Update: {
                    created_at?: string
                    ended_at?: string | null
                    fullscreen_violations?: number
                    id?: string
                    risk_score?: number
                    started_at?: string | null
                    status?: Database['public']['Enums']['session_status']
                    tab_switch_count?: number
                    total_warnings?: number
                    user_id?: string
                }
                Relationships: []
            }
            monitoring_events: {
                Row: {
                    confidence_score: number | null
                    created_at: string
                    event_snapshot: Json | null
                    event_type: Database['public']['Enums']['event_type']
                    id: string
                    is_suspicious: boolean
                    screenshot_url: string | null
                    session_id: string
                    severity: Database['public']['Enums']['event_severity']
                }
                Insert: {
                    confidence_score?: number | null
                    created_at?: string
                    event_snapshot?: Json | null
                    event_type: Database['public']['Enums']['event_type']
                    id?: string
                    is_suspicious?: boolean
                    screenshot_url?: string | null
                    session_id: string
                    severity: Database['public']['Enums']['event_severity']
                }
                Update: {
                    confidence_score?: number | null
                    created_at?: string
                    event_snapshot?: Json | null
                    event_type?: Database['public']['Enums']['event_type']
                    id?: string
                    is_suspicious?: boolean
                    screenshot_url?: string | null
                    session_id?: string
                    severity?: Database['public']['Enums']['event_severity']
                }
                Relationships: [
                    {
                        foreignKeyName: 'monitoring_events_session_id_fkey'
                        columns: ['session_id']
                        isOneToOne: false
                        referencedRelation: 'exam_sessions'
                        referencedColumns: ['id']
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string
                    full_name: string | null
                    id: string
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string
                    full_name?: string | null
                    id: string
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string
                    full_name?: string | null
                    id?: string
                }
                Relationships: []
            }
            screenshots: {
                Row: {
                    created_at: string
                    event_id: string | null
                    id: string
                    image_url: string
                    session_id: string
                    storage_path: string
                }
                Insert: {
                    created_at?: string
                    event_id?: string | null
                    id?: string
                    image_url: string
                    session_id: string
                    storage_path: string
                }
                Update: {
                    created_at?: string
                    event_id?: string | null
                    id?: string
                    image_url?: string
                    session_id?: string
                    storage_path?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'screenshots_event_id_fkey'
                        columns: ['event_id']
                        isOneToOne: false
                        referencedRelation: 'monitoring_events'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'screenshots_session_id_fkey'
                        columns: ['session_id']
                        isOneToOne: false
                        referencedRelation: 'exam_sessions'
                        referencedColumns: ['id']
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            event_severity: 'low' | 'medium' | 'high'
            event_type:
            | 'no_face'
            | 'multiple_faces'
            | 'looking_away'
            | 'tab_switch'
            | 'fullscreen_exit'
            session_status: 'active' | 'completed' | 'terminated'
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// ---------------------------------------------------------------------------
// Convenience type aliases
// ---------------------------------------------------------------------------

type DB = Database['public']

/** Row types — what you get back from SELECT */
export type ProfileRow = DB['Tables']['profiles']['Row']
export type ExamSessionRow = DB['Tables']['exam_sessions']['Row']
export type MonitoringEventRow = DB['Tables']['monitoring_events']['Row']
export type ScreenshotRow = DB['Tables']['screenshots']['Row']

/** Insert types — what you send on INSERT */
export type ProfileInsert = DB['Tables']['profiles']['Insert']
export type ExamSessionInsert = DB['Tables']['exam_sessions']['Insert']
export type MonitoringEventInsert = DB['Tables']['monitoring_events']['Insert']
export type ScreenshotInsert = DB['Tables']['screenshots']['Insert']

/** Update types — partial updates */
export type ProfileUpdate = DB['Tables']['profiles']['Update']
export type ExamSessionUpdate = DB['Tables']['exam_sessions']['Update']
export type MonitoringEventUpdate = DB['Tables']['monitoring_events']['Update']
export type ScreenshotUpdate = DB['Tables']['screenshots']['Update']

/** Enum types */
export type SessionStatus = DB['Enums']['session_status']
export type EventType = DB['Enums']['event_type']
export type EventSeverity = DB['Enums']['event_severity']

// ---------------------------------------------------------------------------
// event_snapshot JSONB shape — strongly typed for AI detection payloads
// ---------------------------------------------------------------------------

export interface EventSnapshot {
    faceCount?: number
    attentionScore?: number       // 0–1
    fullscreen?: boolean
    tabVisible?: boolean
    detectionConfidence?: number       // 0–1
    headPose?: {
        yaw: number
        pitch: number
        roll: number
    }
    timestamp: number       // Unix ms
}

// ---------------------------------------------------------------------------
// Supabase generic helpers (re-exported for convenience)
// ---------------------------------------------------------------------------

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
    T extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views']),
> = (DefaultSchema['Tables'] & DefaultSchema['Views'])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema['Tables']> =
    DefaultSchema['Tables'][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema['Tables']> =
    DefaultSchema['Tables'][T] extends { Update: infer U } ? U : never

export type Enums<T extends keyof DefaultSchema['Enums']> = DefaultSchema['Enums'][T]

export const Constants = {
    public: {
        Enums: {
            event_severity: ['low', 'medium', 'high'] as const,
            event_type: ['no_face', 'multiple_faces', 'looking_away', 'tab_switch', 'fullscreen_exit'] as const,
            session_status: ['active', 'completed', 'terminated'] as const,
        },
    },
} as const
