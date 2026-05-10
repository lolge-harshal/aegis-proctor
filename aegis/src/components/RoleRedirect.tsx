import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui/Spinner'

/**
 * Role-aware root redirect.
 * - candidates  → /session/live  (the only page they need)
 * - proctor / admin → /dashboard
 */
export function RoleRedirect() {
    const role = useAuthStore((s) => s.user?.role)
    const isLoading = useAuthStore((s) => s.isLoading)

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0e0e16]">
                <Spinner size={36} />
            </div>
        )
    }

    if (role === 'candidate') {
        return <Navigate to="/session/live" replace />
    }

    return <Navigate to="/dashboard" replace />
}
