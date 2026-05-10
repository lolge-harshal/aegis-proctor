import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    Video,
    BarChart3,
    History,
    ChevronLeft,
    ChevronRight,
    Shield,
} from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const PROCTOR_NAV = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/session/live', icon: Video, label: 'Live Session' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
    { to: '/history', icon: History, label: 'Session History' },
]

const CANDIDATE_NAV = [
    { to: '/session/live', icon: Video, label: 'My Session' },
]

export function Sidebar() {
    const collapsed = useUIStore((s) => s.sidebarCollapsed)
    const toggleSidebar = useUIStore((s) => s.toggleSidebar)
    const role = useAuthStore((s) => s.user?.role)
    const location = useLocation()

    const navItems = role === 'candidate' ? CANDIDATE_NAV : PROCTOR_NAV

    return (
        <motion.aside
            animate={{ width: collapsed ? 64 : 240 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed left-0 top-0 h-full bg-[#0e0e16] border-r border-[#1e1e2e] flex flex-col z-40 overflow-hidden"
        >
            {/* Logo */}
            <div className="flex items-center h-16 px-4 border-b border-[#1e1e2e] shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-8 h-8 shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                            <Shield size={15} className="text-white" />
                        </div>
                        {/* Subtle glow */}
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 blur-md opacity-30 -z-10" />
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.18 }}
                                className="min-w-0"
                            >
                                <span className="text-white font-bold text-lg tracking-tight whitespace-nowrap">
                                    Aegis
                                </span>
                                <span className="block text-[9px] text-slate-600 uppercase tracking-widest font-medium -mt-0.5">
                                    AI Proctor
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
                {navItems.map(({ to, icon: Icon, label }) => {
                    const isActive = location.pathname.startsWith(to)
                    return (
                        <NavLink
                            key={to}
                            to={to}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative',
                                isActive
                                    ? 'text-indigo-300'
                                    : 'text-slate-500 hover:bg-[#1a1a26] hover:text-slate-200'
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute inset-0 bg-indigo-600/15 rounded-lg border border-indigo-500/20"
                                    transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                                />
                            )}
                            {/* Active left accent bar */}
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-accent"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-full"
                                    transition={{ duration: 0.2 }}
                                />
                            )}
                            <Icon
                                size={17}
                                className={cn(
                                    'shrink-0 relative z-10 transition-transform duration-150',
                                    isActive ? 'text-indigo-400' : 'group-hover:scale-110'
                                )}
                            />
                            <AnimatePresence>
                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -6 }}
                                        transition={{ duration: 0.15 }}
                                        className="text-sm font-medium whitespace-nowrap relative z-10"
                                    >
                                        {label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </NavLink>
                    )
                })}
            </nav>

            {/* Role badge */}
            <AnimatePresence>
                {!collapsed && role && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="px-4 pb-2"
                    >
                        <span className={cn(
                            'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider',
                            role === 'candidate'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : role === 'admin'
                                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        )}>
                            <span className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                role === 'candidate' ? 'bg-emerald-400' : role === 'admin' ? 'bg-violet-400' : 'bg-indigo-400'
                            )} />
                            {role}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Collapse toggle */}
            <div className="p-2 border-t border-[#1e1e2e]">
                <button
                    onClick={toggleSidebar}
                    className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-[#1c1c28] hover:text-slate-300 transition-all duration-150 group"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <motion.div
                        animate={{ rotate: collapsed ? 0 : 180 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronRight size={15} />
                    </motion.div>
                </button>
            </div>
        </motion.aside>
    )
}
