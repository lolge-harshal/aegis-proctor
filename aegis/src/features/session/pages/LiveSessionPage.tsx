import { useEffect, useRef, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Video, AlertTriangle, Square, Wifi, ShieldAlert, Camera, CameraOff } from 'lucide-react'
import { useSessionStore } from '@/store/sessionStore'
import { useAuthStore } from '@/store/authStore'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDuration } from '@/lib/utils'
import {
    startSession,
    endSession,
    subscribeToSession,
    subscribeToEvents,
    getSessionEvents,
} from '@/services/supabase'
import { useMonitoring } from '@/hooks/useMonitoring'
import { requestFullscreen } from '@/monitoring/rules/fullscreenRules'
import type { ExamSessionRow, MonitoringEventRow, EventSeverity } from '@/services/supabase'
import type { EngineStatus } from '@/monitoring/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function severityVariant(severity: EventSeverity): 'rose' | 'amber' | 'slate' {
    if (severity === 'high') return 'rose'
    if (severity === 'medium') return 'amber'
    return 'slate'
}

const EVENT_LABELS: Record<string, string> = {
    no_face: 'Face Not Visible',
    multiple_faces: 'Multiple Faces',
    looking_away: 'Looking Away',
    tab_switch: 'Tab Switch',
    fullscreen_exit: 'Fullscreen Exit',
}

function engineStatusLabel(status: EngineStatus): string {
    switch (status.state) {
        case 'initializing': return 'Loading AI model...'
        case 'running': return 'AI monitoring active'
        case 'error': return `AI error: ${status.error ?? 'unknown'}`
        case 'stopped': return 'Monitoring stopped'
        default: return 'Monitoring idle'
    }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LiveSessionPage() {
    const user = useAuthStore((s) => s.user)
    const { status, elapsedSeconds, sessionId, setStatus, setSessionId, incrementElapsed, resetSession } =
        useSessionStore()

    const [liveSession, setLiveSession] = useState<ExamSessionRow | null>(null)
    const [events, setEvents] = useState<MonitoringEventRow[]>([])
    const [isStarting, setIsStarting] = useState(false)
    const [isEnding, setIsEnding] = useState(false)
    const [startError, setStartError] = useState<string | null>(null)

    const sessionChannelRef = useRef<ReturnType<typeof subscribeToSession> | null>(null)
    const eventsChannelRef = useRef<ReturnType<typeof subscribeToEvents> | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const previewRef = useRef<HTMLVideoElement | null>(null)

    // ── Monitoring engine ────────────────────────────────────────────────────
    const { startMonitoring, stopMonitoring, engineStatus, latestFrame, attachPreview } =
        useMonitoring({
            sessionId,
            // Realtime events from Supabase already update `events` via
            // subscribeToEvents — no need to push them again here.
        })

    // Attach webcam preview whenever the video ref is set
    const setPreviewRef = useCallback(
        (el: HTMLVideoElement | null) => {
            previewRef.current = el
            attachPreview(el)
        },
        [attachPreview]
    )

    // ── Supabase subscription helpers ────────────────────────────────────────
    const cleanupSubscriptions = useCallback(() => {
        sessionChannelRef.current?.unsubscribe()
        sessionChannelRef.current = null
        eventsChannelRef.current?.unsubscribe()
        eventsChannelRef.current = null
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }, [])

    const attachSubscriptions = useCallback(
        (id: string) => {
            sessionChannelRef.current = subscribeToSession(id, (updated) => {
                setLiveSession(updated)
            })
            eventsChannelRef.current = subscribeToEvents(id, (event) => {
                setEvents((prev) => [event, ...prev])
            })
            timerRef.current = setInterval(incrementElapsed, 1000)
        },
        [incrementElapsed]
    )

    // ── Restore session on mount (page refresh while live) ───────────────────
    useEffect(() => {
        if (status === 'live' && sessionId) {
            getSessionEvents(sessionId)
                .then((data) => setEvents(data))
                .catch(() => { })
            attachSubscriptions(sessionId)
            startMonitoring().catch(() => { })
        }
        return cleanupSubscriptions
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── Start session ────────────────────────────────────────────────────────
    const handleStart = useCallback(async () => {
        if (!user) return
        setIsStarting(true)
        setStartError(null)
        setStatus('connecting')

        try {
            // Request fullscreen for the exam environment
            await requestFullscreen()

            const session = await startSession(user.id)
            setLiveSession(session)
            setSessionId(session.id)
            setStatus('live')
            attachSubscriptions(session.id)

            // Start AI monitoring engine
            await startMonitoring()
        } catch (err) {
            setStartError(err instanceof Error ? err.message : 'Failed to start session.')
            setStatus('idle')
        } finally {
            setIsStarting(false)
        }
    }, [user, setStatus, setSessionId, attachSubscriptions, startMonitoring])

    // ── End session ──────────────────────────────────────────────────────────
    const handleEnd = useCallback(async () => {
        if (!sessionId) return
        setIsEnding(true)
        stopMonitoring()
        cleanupSubscriptions()

        try {
            await endSession(sessionId, 'completed')
        } catch {
            // Best-effort
        } finally {
            setIsEnding(false)
            setLiveSession(null)
            setEvents([])
            resetSession()
        }
    }, [sessionId, stopMonitoring, cleanupSubscriptions, resetSession])

    // ── Cleanup on unmount ───────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            stopMonitoring()
            cleanupSubscriptions()
        }
    }, [stopMonitoring, cleanupSubscriptions])

    // ── Derived values ───────────────────────────────────────────────────────
    const riskScore = liveSession?.risk_score ?? 0
    const totalWarnings = liveSession?.total_warnings ?? 0
    const tabSwitches = liveSession?.tab_switch_count ?? 0
    const fullscreenViolations = liveSession?.fullscreen_violations ?? 0

    // ── Idle ─────────────────────────────────────────────────────────────────
    if (status === 'idle') {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6 max-w-sm w-full"
                >
                    <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                        <Video size={36} className="text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">No Active Session</h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Starting a session will request camera access and enter fullscreen.
                        </p>
                    </div>
                    {startError && (
                        <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                            {startError}
                        </p>
                    )}
                    <Button
                        size="lg"
                        loading={isStarting}
                        onClick={handleStart}
                        className="w-full justify-center"
                    >
                        {isStarting ? 'Connecting...' : 'Start Live Session'}
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
                    className="text-center space-y-4"
                >
                    <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mx-auto" />
                    <p className="text-slate-300 font-medium">Establishing secure connection...</p>
                    <p className="text-slate-500 text-sm">Loading AI monitoring model</p>
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
                className="flex items-center justify-between flex-wrap gap-3"
            >
                <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <Badge variant="rose">LIVE</Badge>
                    <h1 className="text-xl font-bold text-white">Active Session</h1>
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <Wifi size={14} />
                        <span>{formatDuration(elapsedSeconds)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="danger"
                        size="sm"
                        icon={<Square size={14} />}
                        loading={isEnding}
                        onClick={handleEnd}
                    >
                        {isEnding ? 'Ending...' : 'End Session'}
                    </Button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left column: webcam + AI status */}
                <div className="space-y-4">
                    {/* Webcam preview */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-white">Camera Feed</h2>
                                {engineStatus.state === 'running' ? (
                                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                                        <Camera size={12} />
                                        <span>Active</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                        <CameraOff size={12} />
                                        <span>{engineStatus.state}</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardBody className="p-2">
                            <div className="relative bg-[#0a0a0f] rounded-lg overflow-hidden aspect-video">
                                <video
                                    ref={setPreviewRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                {/* Head pose overlay */}
                                {latestFrame && latestFrame.faceCount > 0 && latestFrame.headPose && (
                                    <div className="absolute bottom-2 left-2 bg-black/60 rounded px-2 py-1 text-[10px] text-slate-300 font-mono space-y-0.5">
                                        <div>Yaw:   {latestFrame.headPose.yaw.toFixed(1)}°</div>
                                        <div>Pitch: {latestFrame.headPose.pitch.toFixed(1)}°</div>
                                        <div>Faces: {latestFrame.faceCount}</div>
                                    </div>
                                )}
                                {latestFrame?.faceCount === 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-rose-500/20 border border-rose-500/30 rounded-lg px-3 py-2 text-rose-400 text-xs font-medium">
                                            No face detected
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* AI engine status */}
                    <Card>
                        <CardBody className="py-3">
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-2 h-2 rounded-full shrink-0 ${engineStatus.state === 'running'
                                            ? 'bg-emerald-500 animate-pulse'
                                            : engineStatus.state === 'error'
                                                ? 'bg-rose-500'
                                                : 'bg-slate-500'
                                        }`}
                                />
                                <p className="text-xs text-slate-400">
                                    {engineStatusLabel(engineStatus)}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Right column: stats + event feed */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            {
                                label: 'Risk Score',
                                value: `${Math.round(riskScore)}%`,
                                accent:
                                    riskScore >= 60
                                        ? 'text-rose-400'
                                        : riskScore >= 30
                                            ? 'text-amber-400'
                                            : 'text-emerald-400',
                                icon: <ShieldAlert size={16} />,
                            },
                            {
                                label: 'Total Flags',
                                value: totalWarnings,
                                accent: 'text-amber-400',
                                icon: <AlertTriangle size={16} />,
                            },
                            {
                                label: 'Tab Switches',
                                value: tabSwitches,
                                accent: 'text-cyan-400',
                                icon: <Video size={16} />,
                            },
                            {
                                label: 'Fullscreen Exits',
                                value: fullscreenViolations,
                                accent: 'text-rose-400',
                                icon: <Wifi size={16} />,
                            },
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

                    {/* Risk score bar */}
                    <Card>
                        <CardBody className="py-3 space-y-2">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Session Risk Score</span>
                                <span
                                    className={
                                        riskScore >= 60
                                            ? 'text-rose-400'
                                            : riskScore >= 30
                                                ? 'text-amber-400'
                                                : 'text-emerald-400'
                                    }
                                >
                                    {Math.round(riskScore)}%
                                </span>
                            </div>
                            <div className="h-2 bg-[#2a2a3a] rounded-full overflow-hidden">
                                <motion.div
                                    animate={{ width: `${riskScore}%` }}
                                    transition={{ duration: 0.5 }}
                                    className={`h-full rounded-full ${riskScore >= 60
                                            ? 'bg-rose-500'
                                            : riskScore >= 30
                                                ? 'bg-amber-500'
                                                : 'bg-emerald-500'
                                        }`}
                                />
                            </div>
                        </CardBody>
                    </Card>

                    {/* Live event feed */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-semibold text-white">
                                    Live Event Feed
                                </h2>
                                <Badge variant="slate">{events.length} events</Badge>
                            </div>
                        </CardHeader>
                        <CardBody className="p-0 max-h-72 overflow-y-auto">
                            {events.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-500 space-y-2">
                                    <ShieldAlert size={28} className="opacity-40" />
                                    <p className="text-sm">
                                        No events detected yet. Monitoring is active.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-[#2a2a3a]">
                                    {events.map((event, i) => (
                                        <motion.div
                                            key={event.id}
                                            initial={i === 0 ? { opacity: 0, x: -8 } : false}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center justify-between px-5 py-3 hover:bg-[#1a1a26] transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-2 h-2 rounded-full shrink-0 ${event.severity === 'high'
                                                            ? 'bg-rose-500'
                                                            : event.severity === 'medium'
                                                                ? 'bg-amber-500'
                                                                : 'bg-slate-500'
                                                        }`}
                                                />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-200">
                                                        {EVENT_LABELS[event.event_type] ??
                                                            event.event_type}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {new Date(
                                                            event.created_at
                                                        ).toLocaleTimeString()}
                                                        {event.confidence_score != null &&
                                                            ` · ${Math.round(
                                                                event.confidence_score * 100
                                                            )}% confidence`}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={severityVariant(event.severity)}>
                                                {event.severity}
                                            </Badge>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Session ID footer */}
            <p className="text-xs text-slate-600 text-center font-mono">
                Session ID: {sessionId}
            </p>
        </div>
    )
}
