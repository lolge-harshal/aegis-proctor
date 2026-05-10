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

// Nav items visible to proctors and admins
const PROCTOR_NAV = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/session/live', icon: Video, label: 'Live Session' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
    { to: '/history', icon: History, label: 'Session History' },
]

// Nav items visible to candidates (minimal — just the exam session)
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
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed left-0 top-0 h-full bg-[#111118] border-r border-[#2a2a3a] flex flex-col z-40 overflow-hidden"
        >
            {/* Logo */}
            <div className="flex items-center h-16 px-4 border-b border-[#2a2a3a] shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                        <Shield size={16} className="text-white" />
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.2 }}
                                className="text-white font-bold text-lg tracking-tight whitespace-nowrap"
                            >
                                Aegis
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
                {navItems.map(({ to, icon: Icon, label }) => {
                    const isActive = location.pathname.startsWith(to)
                    return (
                        <NavLink
                            key={to}
                            to={to}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative',
                                isActive
                                    ? 'bg-indigo-600/20 text-indigo-400'
                                    : 'text-slate-400 hover:bg-[#1c1c28] hover:text-slate-200'
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute inset-0 bg-indigo-600/15 rounded-lg border border-indigo-500/20"
                                    transition={{ duration: 0.2 }}
                                />
                            )}
                            <Icon size={18} className="shrink-0 relative z-10" />
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-4 pb-2"
                    >
                        <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider',
                            role === 'candidate'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : role === 'admin'
                                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        )}>
                            {role}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Collapse toggle */}
            <div className="p-2 border-t border-[#2a2a3a]">
                <button
                    onClick={toggleSidebar}
                    className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-[#1c1c28] hover:text-slate-200 transition-colors"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>
        </motion.aside>
    )
}
