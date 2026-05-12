import type { AuthError, Session, User } from '@supabase/supabase-js'
import { supabase } from './client'
import type { ProfileRow, UserRole } from './types'

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
// Sign up
// ---------------------------------------------------------------------------

export interface SignUpOptions {
    email: string
    password: string
    fullName: string
    role: Extract<UserRole, 'candidate' | 'proctor'>
    avatarUrl?: string
}

/**
 * Creates a new Supabase auth user and immediately upserts their profile row.
 * Admin accounts are NOT creatable here — they must be seeded manually.
 */
export async function signUpWithEmail(
    options: SignUpOptions
): Promise<AuthResult<Session>> {
    const { email, password, fullName, role, avatarUrl } = options

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role,
            },
        },
    })

    if (error) return { data: null, error }

    // If the session is available immediately (email confirmation disabled),
    // upsert the profile row right away.
    if (data.user) {
        await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName,
            role,
            avatar_url: avatarUrl ?? null,
        })
    }

    return { data: data.session, error: null }
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

/**
 * Sends a password-reset email. The link redirects to /auth/update-password.
 */
export async function sendPasswordResetEmail(email: string): Promise<AuthResult> {
    const redirectTo = `${window.location.origin}/auth/update-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    return { data: null, error }
}

/**
 * Updates the authenticated user's password (called from the update-password page
 * after the user clicks the reset link in their email).
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
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
