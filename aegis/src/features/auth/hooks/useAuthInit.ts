import { useEffect } from 'react'
import { onAuthStateChange, fetchProfile } from '@/services/supabase'
import { useAuthStore } from '@/store/authStore'

/**
 * Bootstraps the auth state from Supabase on app mount.
 *
 * Call this once at the top of the component tree (e.g. App.tsx or main.tsx).
 * It subscribes to Supabase auth changes and keeps the Zustand store in sync.
 */
export function useAuthInit() {
    const setUserFromSession = useAuthStore((s) => s.setUserFromSession)
    const setLoading = useAuthStore((s) => s.setLoading)

    useEffect(() => {
        // Mark as loading while we resolve the initial session
        setLoading(true)

        const unsubscribe = onAuthStateChange(async (session) => {
            if (!session) {
                setUserFromSession(null)
                setLoading(false)
                return
            }

            // Fetch the public profile to get display name + avatar
            const { data: profile } = await fetchProfile(session.user.id)

            setUserFromSession({
                id: session.user.id,
                email: session.user.email ?? '',
                name: profile?.full_name ?? session.user.email ?? 'User',
                // profiles table has no role column — default to 'proctor'
                role: 'proctor',
                avatarUrl: profile?.avatar_url ?? undefined,
            })
            setLoading(false)
        })

        return unsubscribe
    }, [setUserFromSession, setLoading])
}
