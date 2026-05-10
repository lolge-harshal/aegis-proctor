/**
 * LiveEventFeed — animated realtime suspicious activity feed.
 * Renders events from monitoringStore; new events slide in from the top.
 */

import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
    Eye,
    Users,
    MonitorOff,
    TabletSmartphone,
    Maximize2,
    AlertTriangle,
    Activity,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { useMonitoringStore } from '@/store/monitoringStore'
import type { LiveEvent } from '@/store/monitoringStore'
import type { EventType, EventSeverity } from '@/services/supabase'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EVENT_META: Record<EventType, { label: string; icon: React.ElementType }> = {
    no_face: { label: 'Face Not Visible', icon: Eye },
    multiple_faces: { label: 'Multiple Faces', icon: Users },
    looking_away: { label: 'Looking Away', icon: MonitorOff },
    tab_switch: { label: 'Tab Switch', icon: TabletSmartphone },
    fullscreen_exit: { label: 'Fullscreen Exit', icon: Maximize2 },
}

const SEVERITY_BADGE: Record<EventSeverity, 'rose' | 'amber' | 'emerald'> = {
    high: 'rose',
    medium: 'amber',
    low: 'emerald',
}

const SEVERITY_STYLES: Record<EventSeverity, { border: string; bg: string; icon: string; dot: string }> = {
    high: {
        border: 'border-rose-500/25',
        bg: 'bg-rose-500/5',
        icon: 'bg-rose-500/15 text-rose-400',
        dot: 'bg-rose-500',
    },
    medium: {
        border: 'border-amber-500/20',
        bg: 'bg-amber-500/4',
        icon: 'bg-amber-500/15 text-amber-400',
        dot: 'bg-amber-500',
    },
    low: {
        border: 'border-[#2a2a3a]',
        bg: '',
        icon: 'bg-slate-500/15 text-slate-400',
        dot: 'bg-slate-500',
    },
}

function formatTime(iso: string) {
    return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).format(new Date(iso))
}

// ---------------------------------------------------------------------------
// Single event row
// ---------------------------------------------------------------------------

const EventRow = memo(function EventRow({ event }: { event: LiveEvent }) {
    const meta = EVENT_META[event.event_type] ?? { label: event.event_type, icon: AlertTriangle }
    const Icon = meta.icon
    const styles = SEVERITY_STYLES[event.severity]
    const badgeVariant = SEVERITY_BADGE[event.severity]
    const confidence = event.confidence_score != null ? Math.round(event.confidence_score * 100) : null

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={cn(
                'flex items-start gap-3 px-4 py-3 border rounded-xl transition-all duration-300',
                styles.border,
                styles.bg,
                event.isNew && 'ring-1 ring-inset ring-indigo-500/30 shadow-sm shadow-indigo-500/10'
            )}
        >
            {/* Severity dot + icon */}
            <div className="relative mt-0.5 shrink-0">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', styles.icon)}>
                    <Icon size={13} />
                </div>
                {event.isNew && (
                    <span className={cn(
                        'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#16161f]',
                        styles.dot
                    )}>
                        <span className={cn('absolute inset-0 rounded-full animate-ping opacity-60', styles.dot)} />
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-200">{meta.label}</span>
                    <Badge variant={badgeVariant}>{event.severity}</Badge>
                    {event.is_suspicious && (
                        <Badge variant="rose" className="text-[10px]">suspicious</Badge>
                    )}
                </div>

                {/* Confidence bar */}
                {confidence != null && (
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-600 shrink-0">Confidence</span>
                        <div className="flex-1 h-1 bg-[#2a2a3a] rounded-full overflow-hidden max-w-[72px]">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${confidence}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                                className={cn(
                                    'h-full rounded-full',
                                    confidence >= 80 ? 'bg-rose-500' : confidence >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                )}
                            />
                        </div>
                        <span className={cn(
                            'text-[11px] font-semibold tabular-nums',
                            confidence >= 80 ? 'text-rose-400' : confidence >= 50 ? 'text-amber-400' : 'text-emerald-400'
                        )}>
                            {confidence}%
                        </span>
                    </div>
                )}
            </div>

            {/* Timestamp */}
            <span className="text-[10px] text-slate-600 shrink-0 tabular-nums mt-0.5 font-mono">
                {formatTime(event.created_at)}
            </span>
        </motion.div>
    )
})

// ---------------------------------------------------------------------------
// Feed container
// ---------------------------------------------------------------------------

interface LiveEventFeedProps {
    sessionId?: string
    maxItems?: number
    className?: string
}

export function LiveEventFeed({ sessionId, maxItems = 20, className }: LiveEventFeedProps) {
    const allEvents = useMonitoringStore((s) => s.liveEvents)

    const events = sessionId ? allEvents.filter((e) => e.session_id === sessionId) : allEvents
    const visible = events.slice(0, maxItems)

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        {/* Live pulse indicator */}
                        <div className="relative flex items-center justify-center w-3 h-3">
                            <span className="w-2 h-2 rounded-full bg-rose-500 relative z-10" />
                            <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-40" />
                        </div>
                        <h2 className="text-sm font-semibold text-white">Live Activity Feed</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {visible.length > 0 && (
                            <span className="text-xs text-slate-600 tabular-nums font-mono">
                                {visible.length} event{visible.length !== 1 ? 's' : ''}
                            </span>
                        )}
                        <Activity size={13} className="text-slate-600" />
                    </div>
                </div>
            </CardHeader>

            <CardBody className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
                {visible.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-10 text-slate-700 space-y-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-[#1c1c28] flex items-center justify-center">
                            <Activity size={18} className="opacity-50" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-medium text-slate-600">No events yet</p>
                            <p className="text-xs text-slate-700">Monitoring is active and watching</p>
                        </div>
                    </motion.div>
                ) : (
                    <AnimatePresence initial={false} mode="popLayout">
                        {visible.map((event) => (
                            <EventRow key={event.id} event={event} />
                        ))}
                    </AnimatePresence>
                )}
            </CardBody>
        </Card>
    )
}
