import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Video, Users, AlertTriangle, Pause, Square, Wifi } from 'lucide-react'
import { useSessionStore } from '@/store/sessionStore'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { formatDuration } from '@/lib/utils'

const MOCK_PARTICIPANTS = [
    { id: '1', name: 'Jordan Lee', status: 'active' as const, riskScore: 12, flags: [] },
    { id: '2', name: 'Sam Rivera', status: 'flagged' as const, riskScore: 78, flags: ['Tab switch', 'Face not visible'] },
    { id: '3', name: 'Taylor Kim', status: 'active' as const, riskScore: 5, flags: [] },
    { id: '4', name: 'Morgan Chen', status: 'flagged' as const, riskScore: 91, flags: ['Multiple faces', 'Phone detected'] },
    { id: '5', name: 'Casey Park', status: 'active' as const, riskScore: 22, flags: [] },
    { id: '6', name: 'Riley Zhao', status: 'disconnected' as const, riskScore: 0, flags: ['Disconnected'] },
]

export function LiveSessionPage() {
    const { status, elapsedSeconds, setStatus, setParticipants, participants, incrementElapsed } =
        useSessionStore()
    const [isStarting, setIsStarting] = useState(false)

    const handleStart = async () => {
        setIsStarting(true)
        setStatus('connecting')
        await new Promise((r) => setTimeout(r, 1500))
        setParticipants(MOCK_PARTICIPANTS)
        setStatus('live')
        setIsStarting(false)
    }

    const handleEnd = () => {
        useSessionStore.getState().resetSession()
    }

    useEffect(() => {
        if (status !== 'live') return
        const interval = setInterval(incrementElapsed, 1000)
        return () => clearInterval(interval)
    }, [status, incrementElapsed])

    const flaggedCount = participants.filter((p) => p.status === 'flagged').length

    if (status === 'idle') {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6 max-w-sm"
                >
                    <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                        <Video size={36} className="text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">No Active Session</h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Start a proctoring session to monitor participants in real time.
                        </p>
                    </div>
                    <Button size="lg" loading={isStarting} onClick={handleStart} className="w-full justify-center">
                        {isStarting ? 'Connecting...' : 'Start Live Session'}
                    </Button>
                </motion.div>
            </div>
        )
    }

    if (status === 'connecting') {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-4"
                >
                    <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mx-auto" />
                    <p className="text-slate-300 font-medium">Establishing secure connection...</p>
                    <p className="text-slate-500 text-sm">Setting up AI monitoring</p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="space-y-5 max-w-7xl">
            {/* Session header */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between flex-wrap gap-3"
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                        <Badge variant="rose">LIVE</Badge>
                    </div>
                    <h1 className="text-xl font-bold text-white">CS101 Midterm Exam</h1>
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <Wifi size={14} />
                        <span>{formatDuration(elapsedSeconds)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" icon={<Pause size={14} />}>
                        Pause
                    </Button>
                    <Button variant="danger" size="sm" icon={<Square size={14} />} onClick={handleEnd}>
                        End Session
                    </Button>
                </div>
            </motion.div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Participants', value: participants.length, icon: <Users size={16} />, accent: 'text-cyan-400' },
                    { label: 'Flagged', value: flaggedCount, icon: <AlertTriangle size={16} />, accent: 'text-amber-400' },
                    { label: 'Disconnected', value: participants.filter((p) => p.status === 'disconnected').length, icon: <Wifi size={16} />, accent: 'text-rose-400' },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                    >
                        <Card>
                            <CardBody className="flex items-center gap-3 py-3">
                                <span className={s.accent}>{s.icon}</span>
                                <div>
                                    <p className="text-lg font-bold text-white">{s.value}</p>
                                    <p className="text-xs text-slate-400">{s.label}</p>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Participants grid */}
            <Card>
                <CardHeader>
                    <h2 className="text-base font-semibold text-white">Participant Monitor</h2>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {participants.map((p, i) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-[#1c1c28] border border-[#2a2a3a] rounded-xl p-4 space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <Avatar name={p.name} size="sm" />
                                        <span className="text-sm font-medium text-slate-200">{p.name}</span>
                                    </div>
                                    <Badge
                                        variant={
                                            p.status === 'active' ? 'emerald' : p.status === 'flagged' ? 'rose' : 'slate'
                                        }
                                    >
                                        {p.status}
                                    </Badge>
                                </div>

                                {/* Risk score bar */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Risk Score</span>
                                        <span
                                            className={
                                                p.riskScore > 70
                                                    ? 'text-rose-400'
                                                    : p.riskScore > 40
                                                        ? 'text-amber-400'
                                                        : 'text-emerald-400'
                                            }
                                        >
                                            {p.riskScore}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-[#2a2a3a] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${p.riskScore}%` }}
                                            transition={{ duration: 0.6, delay: i * 0.05 }}
                                            className={`h-full rounded-full ${p.riskScore > 70
                                                    ? 'bg-rose-500'
                                                    : p.riskScore > 40
                                                        ? 'bg-amber-500'
                                                        : 'bg-emerald-500'
                                                }`}
                                        />
                                    </div>
                                </div>

                                {p.flags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {p.flags.map((flag) => (
                                            <Badge key={flag} variant="amber" className="text-[10px]">
                                                {flag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        </div>
    )
}
