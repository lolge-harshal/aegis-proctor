import { useState } from 'react'
import { Bell, Search, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { motion, AnimatePresence } from 'framer-motion'

export function Topbar() {
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)
    const navigate = useNavigate()
    const [showBell, setShowBell] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/auth/login')
    }

    return (
        <header className="h-16 bg-[#0e0e16]/95 backdrop-blur-sm border-b border-[#1e1e2e] flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
            {/* Search */}
            <div className="flex items-center gap-2.5 bg-[#16161f] border border-[#2a2a3a] rounded-lg px-3 py-2 w-64 group focus-within:border-indigo-500/50 focus-within:bg-[#18181f] focus-within:shadow-lg focus-within:shadow-indigo-500/5 transition-all duration-200">
                <Search size={14} className="text-slate-600 group-focus-within:text-indigo-400 transition-colors shrink-0" />
                <input
                    type="text"
                    placeholder="Search sessions, reports..."
                    className="bg-transparent text-sm text-slate-300 placeholder:text-slate-600 outline-none w-full"
                />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setShowBell(!showBell)}
                        className="relative p-2 rounded-lg text-slate-500 hover:bg-[#1c1c28] hover:text-slate-200 transition-all duration-150 group"
                        aria-label="Notifications"
                    >
                        <Bell size={17} />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full">
                            <span className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-75" />
                        </span>
                    </button>
                    <AnimatePresence>
                        {showBell && (
                            <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full mt-2 w-72 bg-[#16161f] border border-[#2a2a3a] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                            >
                                <div className="px-4 py-3 border-b border-[#2a2a3a]">
                                    <p className="text-sm font-semibold text-white">Notifications</p>
                                </div>
                                <div className="px-4 py-8 text-center">
                                    <p className="text-xs text-slate-600">No new notifications</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-[#2a2a3a] mx-1" />

                {/* User info */}
                <div className="flex items-center gap-2.5">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-slate-200 leading-tight">{user?.name}</p>
                        <div className="flex justify-end mt-0.5">
                            <Badge variant="indigo" className="text-[10px] py-0">{user?.role}</Badge>
                        </div>
                    </div>
                    <Avatar name={user?.name ?? ''} />
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-150"
                        aria-label="Logout"
                        title="Sign out"
                    >
                        <LogOut size={15} />
                    </button>
                </div>
            </div>
        </header>
    )
}
