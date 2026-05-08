import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui/Spinner'
import type { ReactNode } from 'react'

interface Props {
    children: ReactNode
}

/**
 * Blocks access to protected routes.
 *
 * - While the Supabase session is being resolved (isLoading), renders a
 *   full-screen spinner so we never flash the login page on refresh.
 * - Once resolved, redirects unauthenticated users to /auth/login,
 *   preserving the intended destination in router state.
 */
export function ProtectedRoute({ children }: Props) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const isLoading = useAuthStore((s) => s.isLoading)
    const location = useLocation()

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0e0e16]">
                <Spinner size={36} />
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth/login" state={{ from: location }} replace />
    }

    return <>{children}</>
}
