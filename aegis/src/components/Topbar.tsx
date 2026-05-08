import { Bell, Search, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

export function Topbar() {
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/auth/login')
    }

    return (
        <header className="h-16 bg-[#111118] border-b border-[#2a2a3a] flex items-center justify-between px-6 shrink-0">
            {/* Search */}
            <div className="flex items-center gap-3 bg-[#16161f] border border-[#2a2a3a] rounded-lg px-3 py-2 w-64 group focus-within:border-indigo-500/50 transition-colors">
                <Search size={15} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                    type="text"
                    placeholder="Search sessions, reports..."
                    className="bg-transparent text-sm text-slate-300 placeholder:text-slate-500 outline-none w-full"
                />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
                {/* Notifications */}
                <button className="relative p-2 rounded-lg text-slate-400 hover:bg-[#1c1c28] hover:text-slate-200 transition-colors">
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
                </button>

                {/* User info */}
                <div className="flex items-center gap-3 pl-3 border-l border-[#2a2a3a]">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-slate-200">{user?.name}</p>
                        <div className="flex justify-end">
                            <Badge variant="indigo">{user?.role}</Badge>
                        </div>
                    </div>
                    <Avatar name={user?.name ?? ''} />
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                        aria-label="Logout"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    )
}
