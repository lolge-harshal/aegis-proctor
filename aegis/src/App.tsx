import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useAuthInit } from '@/features/auth/hooks'

/**
 * Root component.
 * useAuthInit subscribes to Supabase auth state changes and keeps the
 * Zustand auth store in sync for the lifetime of the app.
 */
function AppInner() {
  useAuthInit()
  return <RouterProvider router={router} />
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  )
}
