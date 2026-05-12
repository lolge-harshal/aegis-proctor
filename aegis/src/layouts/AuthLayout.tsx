import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'

// Routes that authenticated users are allowed to visit (e.g. password update)
const ALLOW_AUTHENTICATED = ['/auth/update-password']

export function AuthLayout() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const location = useLocation()

    if (isAuthenticated && !ALLOW_AUTHENTICATED.includes(location.pathname)) {
        return <Navigate to="/dashboard" replace />
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
            {/* Background glow effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-600/5 rounded-full blur-3xl" />
                {/* Subtle grid */}
                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative z-10 w-full max-w-md px-4 py-8"
            >
                <Outlet />
            </motion.div>
        </div>
    )
}
