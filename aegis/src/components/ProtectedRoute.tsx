import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui/Spinner'
import type { ReactNode } from 'react'
import type { UserRole } from '@/store/authStore'

interface Props {
    children: ReactNode
    /** If provided, only users with one of these roles can access the route. */
    allowedRoles?: UserRole[]
}

/**
 * Blocks access to protected routes.
 *
 * - While the Supabase session is being resolved (isLoading), renders a
 *   full-screen spinner so we never flash the login page on refresh.
 * - Once resolved, redirects unauthenticated users to /auth/login,
 *   preserving the intended destination in router state.
 * - If allowedRoles is set, redirects unauthorized roles to /session/live
 *   (the only page candidates are allowed to see).
 */
export function ProtectedRoute({ children, allowedRoles }: Props) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const isLoading = useAuthStore((s) => s.isLoading)
    const role = useAuthStore((s) => s.user?.role)
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

    // Role-based access control: redirect unauthorized roles
    if (allowedRoles && role && !allowedRoles.includes(role)) {
        return <Navigate to="/session/live" replace />
    }

    return <>{children}</>
}
