import type { AuthError, Session, User } from '@supabase/supabase-js'
import { supabase } from './client'
import type { ProfileRow } from './types'

// ---------------------------------------------------------------------------
// Result wrapper — avoids throwing across async boundaries
// ---------------------------------------------------------------------------

export interface AuthResult<T = void> {
    data: T | null
    error: AuthError | Error | null
}

// ---------------------------------------------------------------------------
// Sign in / sign out
// ---------------------------------------------------------------------------

export async function signInWithEmail(
    email: string,
    password: string
): Promise<AuthResult<Session>> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data: data.session, error }
}

export async function signOut(): Promise<AuthResult> {
    const { error } = await supabase.auth.signOut()
    return { data: null, error }
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

export async function getSession(): Promise<AuthResult<Session>> {
    const { data, error } = await supabase.auth.getSession()
    return { data: data.session, error }
}

export async function getUser(): Promise<AuthResult<User>> {
    const { data, error } = await supabase.auth.getUser()
    return { data: data.user, error }
}

// ---------------------------------------------------------------------------
// Profile helpers
// ---------------------------------------------------------------------------

/**
 * Fetch the public profile row for a given user id.
 * Returns null (not an error) when the profile doesn't exist yet.
 */
export async function fetchProfile(userId: string): Promise<AuthResult<ProfileRow>> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

    if (error) return { data: null, error }
    return { data, error: null }
}

/**
 * Upsert a profile row — safe to call on first login.
 */
export async function upsertProfile(
    profile: Partial<ProfileRow> & { id: string }
): Promise<AuthResult<ProfileRow>> {
    const { data, error } = await supabase
        .from('profiles')
        .upsert(profile)
        .select()
        .single()

    if (error) return { data: null, error }
    return { data, error: null }
}

// ---------------------------------------------------------------------------
// Auth state listener
// ---------------------------------------------------------------------------

export type AuthChangeCallback = (session: Session | null) => void

/**
 * Subscribe to auth state changes. Returns an unsubscribe function.
 */
export function onAuthStateChange(callback: AuthChangeCallback): () => void {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session)
    })
    return () => data.subscription.unsubscribe()
}
