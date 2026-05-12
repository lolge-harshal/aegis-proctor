import { useAuthStore } from '@/store/authStore'

/**
 * Convenience hook that exposes the full auth state and actions.
 * Prefer this over importing useAuthStore directly in components.
 */
export function useAuth() {
    const user = useAuthStore((s) => s.user)
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const isLoading = useAuthStore((s) => s.isLoading)
    const error = useAuthStore((s) => s.error)
    const login = useAuthStore((s) => s.login)
    const signUp = useAuthStore((s) => s.signUp)
    const logout = useAuthStore((s) => s.logout)
    const clearError = useAuthStore((s) => s.clearError)

    return { user, isAuthenticated, isLoading, error, login, signUp, logout, clearError }
}
