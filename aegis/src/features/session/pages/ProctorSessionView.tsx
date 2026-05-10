/**
 * ProctorSessionView — shown to users with role === 'proctor' or 'admin'.
 * Participant monitor grid, live realtime event feed, session risk score.
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Users, AlertTriangle, Pause, Square, Wifi, Copy, Check, Shield, Activity } from 'lucide-react'
import { useSessionStore } from '@/store/sessionStore'
import { useMonitoringStore } from '@/store/monitoringStore'
import { useAuthStore } from '@/store/authStore'
import { startSession, endSession } from '@/services/supabase'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { LiveEventFeed } from '@/features/session/components/LiveEventFeed'
import { formatDuration, cn } from '@/lib/utils'

const MOCK_PARTICIPANTS = [
    { id: '1', name: 'Jordan Lee', status: 'active' as const, riskScore: 12, flags: [] },
    { id: '2', name: 'Sam Rivera', status: 'flagged' as const, riskScore: 78, flags: ['Tab switch', 'Face not visible'] },
    { id: '3', name: 'Taylor Kim', status: 'active' as const, riskScore: 5, flags: [] },
    { id: '4', name: 'Morgan Chen', status: 'flagged' as const, riskScore: 91, flags: ['Multiple faces', 'Phone detected'] },
    { id: '5', name: 'Casey Park', status: 'active' as const, riskScore: 22, flags: [] },
    { id: '6', name: 'Riley Zhao', status: 'disconnected' as const, riskScore: 0, flags: ['Disconnected'] },
]

// ---------------------------------------------------------------------------
// Participant card
// ---------------------------------------------------------------------------

function ParticipantCard({ p, index }: { p: typeof MOCK_PARTICIPANTS[0]; index: number }) {
    const isHigh = p.riskScore > 70
    const isMedium = p.riskScore > 40

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={cn(
                'bg-[#1a1a26] border rounded-xl p-4 space-y-3 transition-all duration-200',
                p.status === 'flagged'
                    ? 'border-rose-500/20 hover:border-rose-500/35 hover:shadow-lg hover:shadow-rose-500/5'
                    : p.status === 'disconnected'
                        ? 'border-[#2a2a3a] opacity-60'
                        : 'border-[#2a2a3a] hover:border-[#3a3a4a] hover:shadow-lg hover:shadow-black/20',
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                        <Avatar name={p.name} size="sm" />
                        {/* Online indicator */}
                        <span className={cn(
                            'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#1a1a26]',
                            p.status === 'active' ? 'bg-emerald-500' :
                                p.status === 'flagged' ? 'bg-rose-500 animate-pulse' :
                                    'bg-slate-600'
                        )} />
                    </div>
                    <span className="text-sm font-medium text-slate-200 truncate">{p.name}</span>
                </div>
                <Badge
                    variant={p.status === 'active' ? 'emerald' : p.status === 'flagged' ? 'rose' : 'slate'}
                    pulse={p.status === 'flagged'}
                >
                    {p.status}
                </Badge>
            </div>

            {/* Risk score */}
            <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Risk Score</span>
                    <span className={cn(
                        'font-semibold tabular-nums',
                        isHigh ? 'text-rose-400' : isMedium ? 'text-amber-400' : 'text-emerald-400'
                    )}>
                        {p.riskScore}%
                    </span>
                </div>
                <div className="h-1.5 bg-[#2a2a3a] rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p.riskScore}%` }}
                        transition={{ duration: 0.7, delay: index * 0.05, ease: 'easeOut' }}
                        className={cn(
                            'h-full rounded-full',
                            isHigh ? 'risk-bar-high' :
                                isMedium ? 'risk-bar-medium' :
                                    'risk-bar-low'
                        )}
                    />
                </div>
            </div>

            {/* Flags */}
            {p.flags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {p.flags.map((flag) => (
                        <Badge key={flag} variant="amber" className="text-[10px]">{flag}</Badge>
                    ))}
                </div>
            )}
        </motion.div>
    )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export function ProctorSessionView() {
    const { status, elapsedSeconds, sessionId, setStatus, setSessionId, setParticipants, participants, incrementElapsed, resetSession } =
        useSessionStore()
    const user = useAuthStore((s) => s.user)
    const riskScores = useMonitoringStore((s) => s.metrics.riskScores)
    const resetFeed = useMonitoringStore((s) => s.resetFeed)
    const incrementActiveSessions = useMonitoringStore((s) => s.incrementActiveSessions)
    const decrementActiveSessions = useMonitoringStore((s) => s.decrementActiveSessions)

    const [isStarting, setIsStarting] = useState(false)
    const [startError, setStartError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const handleStart = async () => {
        setIsStarting(true)
        setStartError(null)
        setStatus('connecting')

        try {
            if (user?.id) {
                const row = await startSession(user.id)
                setSessionId(row.id)
                incrementActiveSessions()
            } else {
                throw new Error('Not authenticated — cannot create a session row.')
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            setStartError(msg)
            setStatus('idle')
            setIsStarting(false)
            return
        }

        await new Promise((r) => setTimeout(r, 800))
        setParticipants(MOCK_PARTICIPANTS)
        setStatus('live')
        setIsStarting(false)
    }

    const handleEnd = async () => {
        if (sessionId) {
            try { await endSession(sessionId, 'completed') } catch { /* best-effort */ }
            decrementActiveSessions()
        }
        resetFeed()
        resetSession()
    }

    const handleCopySessionId = () => {
        if (!sessionId) return
        navigator.clipboard.writeText(sessionId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    useEffect(() => {
        if (status !== 'live') return
        const interval = setInterval(incrementElapsed, 1000)
        return () => clearInterval(interval)
    }, [status, incrementElapsed])

    const flaggedCount = participants.filter((p) => p.status === 'flagged').length
    const disconnected = participants.filter((p) => p.status === 'disconnected').length
    const liveRiskScore = sessionId && riskScores[sessionId] != null ? riskScores[sessionId] : 0

    // ── Idle ─────────────────────────────────────────────────────────────────
    if (status === 'idle') {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="text-center space-y-6 max-w-sm w-full"
                >
                    <div className="relative mx-auto w-20 h-20">
                        <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center animate-float">
                            <Video size={34} className="text-indigo-400" />
                        </div>
                        <div className="absolute inset-0 rounded-2xl bg-indigo-500/10 blur-xl -z-10" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">No Active Session</h2>
                        <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
                            Start a proctoring session to monitor participants in real time.
                        </p>
                    </div>
                    <AnimatePresence>
                        {startError && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="text-left bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3"
                            >
                                <p className="text-xs font-semibold text-rose-400 mb-1">Session failed to start</p>
                                <p className="text-xs text-rose-300/80 font-mono break-all">{startError}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <Button size="lg" loading={isStarting} onClick={handleStart} className="w-full justify-center">
                        {isStarting ? 'Connecting...' : startError ? 'Retry' : 'Start Live Session'}
                    </Button>
                </motion.div>
            </div>
        )
    }

    // ── Connecting ───────────────────────────────────────────────────────────
    if (status === 'connecting') {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-5"
                >
                    {/* Premium connecting spinner */}
                    <div className="relative w-16 h-16 mx-auto">
                        <div className="absolute inset-0 rounded-full border-2 border-[#2a2a3a]" />
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
                        <div className="absolute inset-2 rounded-full border border-transparent border-t-violet-500/50 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Shield size={16} className="text-indigo-400" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-slate-200 font-semibold">Establishing secure connection</p>
                        <p className="text-slate-600 text-sm">Setting up AI monitoring engine...</p>
                    </div>
                    {/* Animated dots */}
                    <div className="flex items-center justify-center gap-1.5">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        )
    }

    // ── Live ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 max-w-7xl">
            {/* Session header */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between flex-wrap gap-3"
            >
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Live indicator */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        <div className="relative w-2 h-2">
                            <span className="absolute inset-0 rounded-full bg-rose-500" />
                            <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-60" />
                        </div>
                        <span className="text-xs font-bold text-rose-400 tracking-wider">LIVE</span>
                    </div>
                    <h1 className="text-xl font-bold text-white">CS101 Midterm Exam</h1>
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm bg-[#1c1c28] px-2.5 py-1 rounded-lg border border-[#2a2a3a]">
                        <Wifi size={13} className="text-indigo-400" />
                        <span className="font-mono tabular-nums text-slate-300">{formatDuration(elapsedSeconds)}</span>
                    </div>
                    {sessionId ? (
                        <button
                            onClick={handleCopySessionId}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1c1c28] border border-[#2a2a3a] hover:border-indigo-500/40 hover:bg-[#1e1e2e] transition-all duration-150 group"
                            title="Click to copy session ID"
                        >
                            <span className="text-[11px] font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                                {sessionId.slice(0, 8)}…
                            </span>
                            <AnimatePresence mode="wait">
                                {copied ? (
                                    <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                        <Check size={11} className="text-emerald-400" />
                                    </motion.div>
                                ) : (
                                    <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                        <Copy size={11} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    ) : null}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" icon={<Pause size={13} />}>
                        Pause
                    </Button>
                    <Button variant="danger" size="sm" icon={<Square size={13} />} onClick={handleEnd}>
                        End Session
                    </Button>
                </div>
            </motion.div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Participants', value: participants.length, icon: <Users size={16} />, accent: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                    { label: 'Flagged', value: flaggedCount, icon: <AlertTriangle size={16} />, accent: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Disconnected', value: disconnected, icon: <Wifi size={16} />, accent: 'text-rose-400', bg: 'bg-rose-500/10' },
                    {
                        label: 'Session Risk',
                        value: `${liveRiskScore}%`,
                        icon: <Activity size={16} />,
                        accent: liveRiskScore > 70 ? 'text-rose-400' : liveRiskScore > 40 ? 'text-amber-400' : 'text-emerald-400',
                        bg: liveRiskScore > 70 ? 'bg-rose-500/10' : liveRiskScore > 40 ? 'bg-amber-500/10' : 'bg-emerald-500/10',
                    },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.3 }}
                        whileHover={{ y: -1, transition: { duration: 0.15 } }}
                    >
                        <Card>
                            <CardBody className="flex items-center gap-3 py-3.5">
                                <div className={cn('p-2 rounded-lg shrink-0', s.bg)}>
                                    <span className={s.accent}>{s.icon}</span>
                                </div>
                                <div>
                                    <motion.p
                                        key={String(s.value)}
                                        initial={{ opacity: 0.5, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-lg font-bold text-white tabular-nums"
                                    >
                                        {s.value}
                                    </motion.p>
                                    <p className="text-xs text-slate-500">{s.label}</p>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Participants + live feed */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="xl:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-white">Participant Monitor</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-600">{participants.length} candidates</span>
                                    {flaggedCount > 0 && (
                                        <Badge variant="rose" pulse>
                                            {flaggedCount} flagged
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {participants.map((p, i) => (
                                    <ParticipantCard key={p.id} p={p} index={i} />
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <div className="xl:col-span-1">
                    <LiveEventFeed sessionId={sessionId ?? undefined} />
                </div>
            </div>
        </div>
    )
}
