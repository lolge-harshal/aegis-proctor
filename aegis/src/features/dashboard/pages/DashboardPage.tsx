import { motion } from 'framer-motion'
import { Video, Users, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'

const STATS = [
    {
        label: 'Active Sessions',
        value: 3,
        icon: <Video size={20} />,
        accent: 'indigo' as const,
        trend: { value: 12, label: 'vs last week' },
    },
    {
        label: 'Total Participants',
        value: 142,
        icon: <Users size={20} />,
        accent: 'cyan' as const,
        trend: { value: 8, label: 'vs last week' },
    },
    {
        label: 'Flags Raised',
        value: 17,
        icon: <AlertTriangle size={20} />,
        accent: 'amber' as const,
        trend: { value: -3, label: 'vs last week' },
    },
    {
        label: 'Sessions Completed',
        value: 89,
        icon: <CheckCircle size={20} />,
        accent: 'emerald' as const,
        trend: { value: 5, label: 'vs last week' },
    },
]

const RECENT_SESSIONS = [
    { id: 'S-001', name: 'CS101 Midterm', participants: 48, status: 'live', flags: 2 },
    { id: 'S-002', name: 'Data Structures Final', participants: 35, status: 'live', flags: 0 },
    { id: 'S-003', name: 'Algorithms Quiz', participants: 22, status: 'live', flags: 5 },
    { id: 'S-004', name: 'OS Concepts Exam', participants: 60, status: 'completed', flags: 1 },
    { id: 'S-005', name: 'Networks Midterm', participants: 41, status: 'completed', flags: 3 },
]

export function DashboardPage() {
    const user = useAuthStore((s) => s.user)
    const navigate = useNavigate()

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Page header */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Good morning, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-slate-400 text-sm mt-0.5">Here's what's happening today.</p>
                </div>
                <Button icon={<Video size={15} />} onClick={() => navigate('/session/live')}>
                    Start Session
                </Button>
            </motion.div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {STATS.map((stat, i) => (
                    <StatCard key={stat.label} {...stat} index={i} />
                ))}
            </div>

            {/* Recent sessions */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
            >
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-white">Recent Sessions</h2>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
                                View all
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0">
                        <div className="divide-y divide-[#2a2a3a]">
                            {RECENT_SESSIONS.map((session) => (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between px-5 py-3.5 hover:bg-[#1a1a26] transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                            <Video size={14} className="text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">{session.name}</p>
                                            <p className="text-xs text-slate-500">{session.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-slate-400 hidden sm:block">
                                            {session.participants} participants
                                        </span>
                                        {session.flags > 0 && (
                                            <Badge variant="amber">{session.flags} flags</Badge>
                                        )}
                                        <Badge variant={session.status === 'live' ? 'rose' : 'slate'}>
                                            {session.status === 'live' ? '● Live' : 'Completed'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </motion.div>
        </div>
    )
}
