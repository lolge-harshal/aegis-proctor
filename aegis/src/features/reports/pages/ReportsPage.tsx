import { motion } from 'framer-motion'
import { BarChart3, Download, Filter, TrendingUp, AlertTriangle, Users, Clock } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'

const REPORT_STATS = [
    { label: 'Total Sessions', value: 89, icon: <BarChart3 size={20} />, accent: 'indigo' as const },
    { label: 'Avg. Risk Score', value: '23%', icon: <TrendingUp size={20} />, accent: 'cyan' as const },
    { label: 'Total Flags', value: 214, icon: <AlertTriangle size={20} />, accent: 'amber' as const },
    { label: 'Participants Tested', value: '1.2k', icon: <Users size={20} />, accent: 'emerald' as const },
]

const FLAG_TYPES = [
    { label: 'Tab Switch', count: 87, pct: 41 },
    { label: 'Face Not Visible', count: 54, pct: 25 },
    { label: 'Multiple Faces', count: 38, pct: 18 },
    { label: 'Phone Detected', count: 21, pct: 10 },
    { label: 'Audio Anomaly', count: 14, pct: 6 },
]

const RECENT_REPORTS = [
    { id: 'R-089', session: 'CS101 Midterm', date: 'May 7, 2026', participants: 48, flags: 12, risk: 'high' },
    { id: 'R-088', session: 'Data Structures Final', date: 'May 6, 2026', participants: 35, flags: 3, risk: 'low' },
    { id: 'R-087', session: 'Algorithms Quiz', date: 'May 5, 2026', participants: 22, flags: 7, risk: 'medium' },
    { id: 'R-086', session: 'OS Concepts Exam', date: 'May 4, 2026', participants: 60, flags: 1, risk: 'low' },
    { id: 'R-085', session: 'Networks Midterm', date: 'May 3, 2026', participants: 41, flags: 9, risk: 'medium' },
]

const riskVariant = (risk: string) =>
    risk === 'high' ? 'rose' : risk === 'medium' ? 'amber' : 'emerald'

export function ReportsPage() {
    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between flex-wrap gap-3"
            >
                <div>
                    <h1 className="text-2xl font-bold text-white">Reports</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Analytics and insights across all sessions.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" icon={<Filter size={14} />}>
                        Filter
                    </Button>
                    <Button variant="secondary" size="sm" icon={<Download size={14} />}>
                        Export
                    </Button>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {REPORT_STATS.map((s, i) => (
                    <StatCard key={s.label} {...s} index={i} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Flag breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="h-full">
                        <CardHeader>
                            <h2 className="text-base font-semibold text-white">Flag Breakdown</h2>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            {FLAG_TYPES.map((f) => (
                                <div key={f.label} className="space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-300">{f.label}</span>
                                        <span className="text-slate-400">{f.count}</span>
                                    </div>
                                    <div className="h-2 bg-[#2a2a3a] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${f.pct}%` }}
                                            transition={{ duration: 0.7, delay: 0.3 }}
                                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardBody>
                    </Card>
                </motion.div>

                {/* Session time distribution placeholder */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="lg:col-span-2"
                >
                    <Card className="h-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-semibold text-white">Session Activity</h2>
                                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                    <Clock size={13} />
                                    <span>Last 30 days</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardBody className="flex items-end gap-1.5 h-40">
                            {[40, 65, 30, 80, 55, 90, 45, 70, 35, 85, 60, 75, 50, 95].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scaleY: 0 }}
                                    animate={{ scaleY: 1 }}
                                    transition={{ duration: 0.4, delay: i * 0.04 }}
                                    style={{ height: `${h}%`, originY: 1 }}
                                    className="flex-1 bg-gradient-to-t from-indigo-600 to-indigo-400/60 rounded-t-sm min-w-0"
                                />
                            ))}
                        </CardBody>
                    </Card>
                </motion.div>
            </div>

            {/* Reports table */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
            >
                <Card>
                    <CardHeader>
                        <h2 className="text-base font-semibold text-white">Session Reports</h2>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#2a2a3a]">
                                    {['Report ID', 'Session', 'Date', 'Participants', 'Flags', 'Risk', ''].map((h) => (
                                        <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2a2a3a]">
                                {RECENT_REPORTS.map((r) => (
                                    <tr key={r.id} className="hover:bg-[#1a1a26] transition-colors">
                                        <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{r.id}</td>
                                        <td className="px-5 py-3.5 text-slate-200 font-medium">{r.session}</td>
                                        <td className="px-5 py-3.5 text-slate-400">{r.date}</td>
                                        <td className="px-5 py-3.5 text-slate-300">{r.participants}</td>
                                        <td className="px-5 py-3.5 text-slate-300">{r.flags}</td>
                                        <td className="px-5 py-3.5">
                                            <Badge variant={riskVariant(r.risk) as 'rose' | 'amber' | 'emerald'}>{r.risk}</Badge>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <Button variant="ghost" size="sm" icon={<Download size={13} />}>
                                                Export
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </motion.div>
        </div>
    )
}
