import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { LiveSessionPage } from '@/features/session/pages/LiveSessionPage'
import { ReportsPage } from '@/features/reports/pages/ReportsPage'
import { SessionHistoryPage } from '@/features/history/pages/SessionHistoryPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
    {
        path: '/auth',
        element: <AuthLayout />,
        children: [
            { index: true, element: <Navigate to="/auth/login" replace /> },
            { path: 'login', element: <LoginPage /> },
        ],
    },
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <AppLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="/dashboard" replace /> },
            { path: 'dashboard', element: <DashboardPage /> },
            { path: 'session/live', element: <LiveSessionPage /> },
            { path: 'reports', element: <ReportsPage /> },
            { path: 'history', element: <SessionHistoryPage /> },
        ],
    },
    { path: '*', element: <NotFoundPage /> },
])
