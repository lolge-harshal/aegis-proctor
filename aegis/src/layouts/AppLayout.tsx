import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { useUIStore } from '@/store/uiStore'
import { useGlobalMonitoring } from '@/features/session/hooks'
import { cn } from '@/lib/utils'

export function AppLayout() {
    const collapsed = useUIStore((s) => s.sidebarCollapsed)

    // Keeps realtime subscriptions alive across all page navigations
    useGlobalMonitoring()

    return (
        <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">
            <Sidebar />
            <div
                className={cn(
                    'flex flex-col flex-1 min-w-0 transition-all duration-300',
                    collapsed ? 'ml-16' : 'ml-60'
                )}
            >
                <Topbar />
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
