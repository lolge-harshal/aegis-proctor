import { create } from 'zustand'
import { signInWithEmail, signOut } from '@/services/supabase'
import type { UserRole as DBUserRole } from '@/services/supabase'

export type UserRole = DBUserRole

export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    avatarUrl?: string
}

interface AuthState {
    // ── State ──────────────────────────────────────────────────────────────
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    /** Holds the last auth error message, cleared on next login attempt. */
    error: string | null

    // ── Actions ────────────────────────────────────────────────────────────
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    /** Called by useAuthInit to sync Supabase session → store. */
    setUserFromSession: (user: User | null) => void
    setLoading: (loading: boolean) => void
    clearError: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true, // true on mount — resolved by useAuthInit
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null })

        const { error } = await signInWithEmail(email, password)

        if (error) {
            set({ isLoading: false, error: error.message })
            // Re-throw so the form can catch it if needed
            throw error
        }

        // Session is set by the onAuthStateChange listener in useAuthInit,
        // so we don't need to set user here — just clear the loading flag.
        // (isLoading will be cleared by the listener callback)
    },

    logout: async () => {
        set({ isLoading: true, error: null })
        await signOut()
        set({ user: null, isAuthenticated: false, isLoading: false, error: null })
    },

    setUserFromSession: (user) => {
        set({
            user,
            isAuthenticated: user !== null,
        })
    },

    setLoading: (loading) => set({ isLoading: loading }),

    clearError: () => set({ error: null }),
}))
