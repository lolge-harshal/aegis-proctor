import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { useUIStore } from '@/store/uiStore'
import { useGlobalMonitoring } from '@/features/session/hooks'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export function AppLayout() {
    const collapsed = useUIStore((s) => s.sidebarCollapsed)
    const location = useLocation()

    // Keeps realtime subscriptions alive across all page navigations
    useGlobalMonitoring()

    return (
        <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">
            <Sidebar />
            <div
                className={cn(
                    'flex flex-col flex-1 min-w-0 transition-all duration-250',
                    collapsed ? 'ml-16' : 'ml-60'
                )}
            >
                <Topbar />
                <main className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="p-6 min-h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    )
}
