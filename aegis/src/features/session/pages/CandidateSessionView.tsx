/**
 * CandidateSessionView — shown to users with role === 'candidate'.
 * Camera feed, AI monitoring engine, fullscreen enforcement, personal risk score.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, AlertTriangle, Square, Wifi, ShieldAlert, Camera, CameraOff, Shield, Activity } from 'lucide-react'
import { useSessionStore } from '@/store/sessionStore'
import { useAuthStore } from '@/store/authStore'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDuration, cn } from '@/lib/utils'
import {
    startSession,
    endSession,
    subscribeToSession,
    subscribeToEvents,
    getSessionEvents,
} from '@/services/supabase'
import { supabase } from '@/services/supabase/client'
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

function getRiskClass(score: number) {
    if (score >= 60) return { bar: 'risk-bar-high', text: 'text-rose-400', label: 'High Risk' }
    if (score >= 30) return { bar: 'risk-bar-medium', text: 'text-amber-400', label: 'Medium Risk' }
    return { bar: 'risk-bar-low', text: 'text-emerald-400', label: 'Low Risk' }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CandidateSessionView() {
    const user = useAuthStore((s) => s.user)
    const { status, elapsedSeconds, sessionId, setStatus, setSessionId, resetSession } =
        useSessionStore()

    const [liveSession, setLiveSession] = useState<ExamSessionRow | null>(null)
    const [events, setEvents] = useState<MonitoringEventRow[]>([])
    const [isStarting, setIsStarting] = useState(false)
    const [isEnding, setIsEnding] = useState(false)
    const [startError, setStartError] = useState<string | null>(null)

    const sessionChannelRef = useRef<ReturnType<typeof subscribeToSession> | null>(null)
    const eventsChannelRef = useRef<ReturnType<typeof subscribeToEvents> | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const videoElRef = useRef<HTMLVideoElement | null>(null)

    const { startMonitoring, stopMonitoring, engineStatus, latestFrame, attachPreview } =
        useMonitoring()

    const startTimer = useCallback(() => {
        if (timerRef.current !== null) return
        timerRef.current = setInterval(() => {
            useSessionStore.getState().incrementElapsed()
        }, 1000)
    }, [])

    const stopTimer = useCallback(() => {
        if (timerRef.current !== null) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }, [])

    const cleanupSubscriptions = useCallback(() => {
        if (sessionChannelRef.current) {
            supabase.removeChannel(sessionChannelRef.current)
            sessionChannelRef.current = null
        }
        if (eventsChannelRef.current) {
            supabase.removeChannel(eventsChannelRef.current)
            eventsChannelRef.current = null
        }
        stopTimer()
    }, [stopTimer])

    const attachSubscriptions = useCallback((id: string) => {
        sessionChannelRef.current = subscribeToSession(id, (updated) => setLiveSession(updated))
        eventsChannelRef.current = subscribeToEvents(id, (event) => setEvents((prev) => [event, ...prev]))
        startTimer()
    }, [startTimer])

    const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
        videoElRef.current = el
        if (el) attachPreview(el)
    }, [attachPreview])

    useEffect(() => {
        if (status === 'live' && sessionId) {
            getSessionEvents(sessionId).then((data) => setEvents(data)).catch(() => { })
            attachSubscriptions(sessionId)
            startMonitoring(sessionId).catch(() => { })
        }
        return cleanupSubscriptions
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleStart = useCallback(async () => {
        if (!user) return
        setIsStarting(true)
        setStartError(null)
        setStatus('connecting')

        try {
            await requestFullscreen()
            const session = await startSession(user.id)
            setLiveSession(session)
            setSessionId(session.id)
            setStatus('live')
            attachSubscriptions(session.id)
            await startMonitoring(session.id)
        } catch (err) {
            setStartError(err instanceof Error ? err.message : 'Failed to start session.')
            setStatus('idle')
            stopTimer()
        } finally {
            setIsStarting(false)
        }
    }, [user, setStatus, setSessionId, attachSubscriptions, startMonitoring, stopTimer])

    const handleEnd = useCallback(async () => {
        if (!sessionId) return
        setIsEnding(true)
        stopMonitoring()
        cleanupSubscriptions()

        try { await endSession(sessionId, 'completed') } catch { /* best-effort */ }
        finally {
            setIsEnding(false)
            setLiveSession(null)
            setEvents([])
            resetSession()
        }
    }, [sessionId, stopMonitoring, cleanupSubscriptions, resetSession])

    useEffect(() => {
        return () => {
            stopMonitoring()
            cleanupSubscriptions()
        }
    }, [stopMonitoring, cleanupSubscriptions])

    const riskScore = liveSession?.risk_score ?? 0
    const totalWarnings = liveSession?.total_warnings ?? 0
    const tabSwitches = liveSession?.tab_switch_count ?? 0
    const fullscreenViolations = liveSession?.fullscreen_violations ?? 0
    const riskStyle = getRiskClass(riskScore)

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
                            Starting a session will request camera access and enter fullscreen.
                        </p>
                    </div>
                    <AnimatePresence>
                        {startError && (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-left"
                            >
                                {startError}
                            </motion.p>
                        )}
                    </AnimatePresence>
                    <Button size="lg" loading={isStarting} onClick={handleStart} className="w-full justify-center">
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
                    className="text-center space-y-5"
                >
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
                        <p className="text-slate-600 text-sm">Loading AI monitoring model...</p>
                    </div>
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
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        <div className="relative w-2 h-2">
                            <span className="absolute inset-0 rounded-full bg-rose-500" />
                            <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-60" />
                        </div>
                        <span className="text-xs font-bold text-rose-400 tracking-wider">LIVE</span>
                    </div>
                    <h1 className="text-xl font-bold text-white">Active Session</h1>
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm bg-[#1c1c28] px-2.5 py-1 rounded-lg border border-[#2a2a3a]">
                        <Wifi size={13} className="text-indigo-400" />
                        <span className="font-mono tabular-nums text-slate-300">{formatDuration(elapsedSeconds)}</span>
                    </div>
                </div>
                <Button
                    variant="danger"
                    size="sm"
                    icon={<Square size={13} />}
                    loading={isEnding}
                    onClick={handleEnd}
                >
                    {isEnding ? 'Ending...' : 'End Session'}
                </Button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left: webcam + AI status */}
                <div className="space-y-3">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-white">Camera Feed</h2>
                                {engineStatus.state === 'running' ? (
                                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <Camera size={11} />
                                        <span>Active</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                                        <CameraOff size={11} />
                                        <span>{engineStatus.state}</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardBody className="p-2">
                            {/* Webcam with corner frame decorations */}
                            <div className="relative bg-[#0a0a0f] rounded-lg overflow-hidden aspect-video webcam-frame">
                                <video
                                    ref={setVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                />

                                {/* Scan line animation when running */}
                                {engineStatus.state === 'running' && (
                                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent animate-scan-line" />
                                    </div>
                                )}

                                {/* Head pose overlay */}
                                {latestFrame && latestFrame.faceCount > 0 && latestFrame.headPose && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-[10px] text-slate-300 font-mono space-y-0.5 border border-white/5"
                                    >
                                        <div className="flex gap-2">
                                            <span className="text-slate-600">Yaw</span>
                                            <span>{latestFrame.headPose.yaw.toFixed(1)}°</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-slate-600">Pitch</span>
                                            <span>{latestFrame.headPose.pitch.toFixed(1)}°</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-slate-600">Faces</span>
                                            <span className="text-emerald-400">{latestFrame.faceCount}</span>
                                        </div>
                                    </motion.div>
                                )}

                                {/* No face detected overlay */}
                                <AnimatePresence>
                                    {latestFrame?.faceCount === 0 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 flex items-center justify-center bg-rose-950/20"
                                        >
                                            <div className="bg-rose-500/20 backdrop-blur-sm border border-rose-500/30 rounded-xl px-4 py-2.5 text-rose-400 text-xs font-semibold flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                No face detected
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Top-right corner decorations */}
                                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                                    {engineStatus.state === 'running' && (
                                        <div className="bg-black/60 backdrop-blur-sm rounded-md px-2 py-0.5 flex items-center gap-1 border border-white/5">
                                            <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                                            <span className="text-[9px] text-slate-400 font-mono">REC</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Engine status */}
                    <div className={cn(
                        'flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all duration-300',
                        engineStatus.state === 'running'
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : engineStatus.state === 'error'
                                ? 'bg-rose-500/5 border-rose-500/20'
                                : 'bg-[#16161f] border-[#2a2a3a]'
                    )}>
                        <div className={cn(
                            'w-2 h-2 rounded-full shrink-0',
                            engineStatus.state === 'running'
                                ? 'bg-emerald-500 animate-pulse'
                                : engineStatus.state === 'error'
                                    ? 'bg-rose-500'
                                    : 'bg-slate-600'
                        )} />
                        <p className={cn(
                            'text-xs font-medium',
                            engineStatus.state === 'running' ? 'text-emerald-400' :
                                engineStatus.state === 'error' ? 'text-rose-400' :
                                    'text-slate-500'
                        )}>
                            {engineStatusLabel(engineStatus)}
                        </p>
                    </div>
                </div>

                {/* Right: stats + event feed */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Stat cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            {
                                label: 'Risk Score',
                                value: `${Math.round(riskScore)}%`,
                                accent: riskStyle.text,
                                bg: riskScore >= 60 ? 'bg-rose-500/10' : riskScore >= 30 ? 'bg-amber-500/10' : 'bg-emerald-500/10',
                                icon: <ShieldAlert size={15} />,
                            },
                            { label: 'Total Flags', value: totalWarnings, accent: 'text-amber-400', bg: 'bg-amber-500/10', icon: <AlertTriangle size={15} /> },
                            { label: 'Tab Switches', value: tabSwitches, accent: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: <Video size={15} /> },
                            { label: 'Fullscreen Exits', value: fullscreenViolations, accent: 'text-rose-400', bg: 'bg-rose-500/10', icon: <Wifi size={15} /> },
                        ].map((s, i) => (
                            <motion.div
                                key={s.label}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07, duration: 0.3 }}
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

                    {/* Risk score bar */}
                    <Card>
                        <CardBody className="py-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Activity size={13} className="text-slate-500" />
                                    <span className="text-xs font-medium text-slate-400">Session Risk Score</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={cn('text-sm font-bold tabular-nums', riskStyle.text)}>
                                        {Math.round(riskScore)}%
                                    </span>
                                    <span className={cn('text-xs', riskStyle.text)}>{riskStyle.label}</span>
                                </div>
                            </div>
                            <div className="h-2.5 bg-[#1c1c28] rounded-full overflow-hidden border border-[#2a2a3a]">
                                <motion.div
                                    animate={{ width: `${riskScore}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                    className={cn('h-full rounded-full', riskStyle.bar)}
                                />
                            </div>
                            {/* Threshold markers */}
                            <div className="relative h-1">
                                <div className="absolute left-[30%] top-0 w-px h-2 bg-amber-500/30" />
                                <div className="absolute left-[60%] top-0 w-px h-2 bg-rose-500/30" />
                                <span className="absolute left-[30%] -translate-x-1/2 text-[9px] text-slate-700 top-2">30%</span>
                                <span className="absolute left-[60%] -translate-x-1/2 text-[9px] text-slate-700 top-2">60%</span>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Event feed */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-white">Live Event Feed</h2>
                                <Badge variant="slate">{events.length} events</Badge>
                            </div>
                        </CardHeader>
                        <CardBody className="p-0 max-h-72 overflow-y-auto">
                            {events.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-10 text-slate-700 space-y-3"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-[#1c1c28] flex items-center justify-center">
                                        <ShieldAlert size={18} className="opacity-50" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-medium text-slate-600">No events detected</p>
                                        <p className="text-xs text-slate-700">Monitoring is active and watching</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="divide-y divide-[#1e1e2e]">
                                    <AnimatePresence initial={false}>
                                        {events.map((event, i) => (
                                            <motion.div
                                                key={event.id}
                                                initial={i === 0 ? { opacity: 0, x: -8, backgroundColor: 'rgba(99,102,241,0.05)' } : false}
                                                animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(0,0,0,0)' }}
                                                transition={{ duration: 0.3 }}
                                                className="flex items-center justify-between px-5 py-3 hover:bg-[#1a1a26] transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        'w-2 h-2 rounded-full shrink-0',
                                                        event.severity === 'high' ? 'bg-rose-500' :
                                                            event.severity === 'medium' ? 'bg-amber-500' :
                                                                'bg-slate-500'
                                                    )} />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-200">
                                                            {EVENT_LABELS[event.event_type] ?? event.event_type}
                                                        </p>
                                                        <p className="text-xs text-slate-600 font-mono">
                                                            {new Date(event.created_at).toLocaleTimeString()}
                                                            {event.confidence_score != null &&
                                                                ` · ${Math.round(event.confidence_score * 100)}% conf`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant={severityVariant(event.severity)}>
                                                    {event.severity}
                                                </Badge>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>

            <p className="text-xs text-slate-700 text-center font-mono">
                Session ID: {sessionId}
            </p>
        </div>
    )
}
