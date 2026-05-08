import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Calendar, ChevronRight, Video } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const ALL_SESSIONS = [
    { id: 'S-089', name: 'CS101 Midterm', date: 'May 7, 2026', duration: '2h 15m', participants: 48, flags: 12, status: 'completed' },
    { id: 'S-088', name: 'Data Structures Final', date: 'May 6, 2026', duration: '3h 00m', participants: 35, flags: 3, status: 'completed' },
    { id: 'S-087', name: 'Algorithms Quiz', date: 'May 5, 2026', duration: '1h 30m', participants: 22, flags: 7, status: 'completed' },
    { id: 'S-086', name: 'OS Concepts Exam', date: 'May 4, 2026', duration: '2h 45m', participants: 60, flags: 1, status: 'completed' },
    { id: 'S-085', name: 'Networks Midterm', date: 'May 3, 2026', duration: '2h 00m', participants: 41, flags: 9, status: 'completed' },
    { id: 'S-084', name: 'Database Systems Quiz', date: 'May 2, 2026', duration: '1h 00m', participants: 29, flags: 0, status: 'completed' },
    { id: 'S-083', name: 'Software Engineering Final', date: 'May 1, 2026', duration: '3h 30m', participants: 55, flags: 14, status: 'completed' },
    { id: 'S-082', name: 'Computer Graphics Exam', date: 'Apr 30, 2026', duration: '2h 00m', participants: 18, flags: 2, status: 'completed' },
]

export function SessionHistoryPage() {
    const [query, setQuery] = useState('')

    const filtered = ALL_SESSIONS.filter(
        (s) =>
            s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.id.toLowerCase().includes(query.toLowerCase())
    )

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between flex-wrap gap-3"
            >
                <div>
                    <h1 className="text-2xl font-bold text-white">Session History</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Browse and review all past proctoring sessions.</p>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Calendar size={15} />
                    <span>{ALL_SESSIONS.length} sessions total</span>
                </div>
            </motion.div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Input
                    placeholder="Search by session name or ID..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    icon={<Search size={15} />}
                />
            </motion.div>

            {/* Sessions list */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                <Card>
                    <CardHeader>
                        <h2 className="text-base font-semibold text-white">
                            {filtered.length} session{filtered.length !== 1 ? 's' : ''}
                        </h2>
                    </CardHeader>
                    <CardBody className="p-0">
                        {filtered.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Video size={32} className="mx-auto mb-3 opacity-40" />
                                <p>No sessions match your search.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#2a2a3a]">
                                {filtered.map((session, i) => (
                                    <motion.div
                                        key={session.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="flex items-center justify-between px-5 py-4 hover:bg-[#1a1a26] transition-colors group"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                                                <Video size={16} className="text-indigo-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-200 truncate">{session.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-slate-500 font-mono">{session.id}</span>
                                                    <span className="text-slate-600">·</span>
                                                    <span className="text-xs text-slate-500">{session.date}</span>
                                                    <span className="text-slate-600">·</span>
                                                    <span className="text-xs text-slate-500">{session.duration}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs text-slate-400 hidden sm:block">
                                                {session.participants} participants
                                            </span>
                                            {session.flags > 0 ? (
                                                <Badge variant="amber">{session.flags} flags</Badge>
                                            ) : (
                                                <Badge variant="emerald">Clean</Badge>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={<ChevronRight size={14} />}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                View
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </motion.div>
        </div>
    )
}
