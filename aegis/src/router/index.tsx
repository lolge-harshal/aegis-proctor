import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { SignupPage } from '@/features/auth/pages/SignupPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { UpdatePasswordPage } from '@/features/auth/pages/UpdatePasswordPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { LiveSessionPage } from '@/features/session/pages/LiveSessionPage'
import { ReportsPage } from '@/features/reports/pages/ReportsPage'
import { SessionHistoryPage } from '@/features/history/pages/SessionHistoryPage'
import { OnboardingPage } from '@/features/onboarding/pages/OnboardingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RoleRedirect } from '@/components/RoleRedirect'

export const router = createBrowserRouter([
    // ── Auth routes (unauthenticated) ────────────────────────────────────────
    {
        path: '/auth',
        element: <AuthLayout />,
        children: [
            { index: true, element: <Navigate to="/auth/login" replace /> },
            { path: 'login', element: <LoginPage /> },
            { path: 'signup', element: <SignupPage /> },
            { path: 'forgot-password', element: <ForgotPasswordPage /> },
            // update-password is accessible while authenticated (coming from email link)
            { path: 'update-password', element: <UpdatePasswordPage /> },
        ],
    },

    // ── Onboarding (protected — must be logged in) ───────────────────────────
    {
        path: '/onboarding',
        element: (
            <ProtectedRoute>
                <OnboardingPage />
            </ProtectedRoute>
        ),
    },

    // ── App routes (protected) ───────────────────────────────────────────────
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <AppLayout />
            </ProtectedRoute>
        ),
        children: [
            // Root redirect is role-aware: candidates go to /session/live,
            // proctors/admins go to /dashboard
            { index: true, element: <RoleRedirect /> },

            // Proctor/admin only routes
            {
                path: 'dashboard',
                element: (
                    <ProtectedRoute allowedRoles={['proctor', 'admin']}>
                        <DashboardPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'reports',
                element: (
                    <ProtectedRoute allowedRoles={['proctor', 'admin']}>
                        <ReportsPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'history',
                element: (
                    <ProtectedRoute allowedRoles={['proctor', 'admin']}>
                        <SessionHistoryPage />
                    </ProtectedRoute>
                ),
            },

            // Available to all authenticated roles
            { path: 'session/live', element: <LiveSessionPage /> },
        ],
    },

    { path: '*', element: <NotFoundPage /> },
])
