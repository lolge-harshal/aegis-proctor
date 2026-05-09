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

const SEVERITY_GLOW: Record<EventSeverity, string> = {
    high: 'border-rose-500/30 bg-rose-500/5',
    medium: 'border-amber-500/30 bg-amber-500/5',
    low: 'border-[#2a2a3a]',
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
    const meta = EVENT_META[event.event_type] ?? {
        label: event.event_type,
        icon: AlertTriangle,
    }
    const Icon = meta.icon
    const badgeVariant = SEVERITY_BADGE[event.severity]
    const glowClass = SEVERITY_GLOW[event.severity]

    const confidence =
        event.confidence_score != null
            ? Math.round(event.confidence_score * 100)
            : null

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={cn(
                'flex items-start gap-3 px-4 py-3 border rounded-lg transition-colors',
                glowClass,
                event.isNew && 'ring-1 ring-inset ring-indigo-500/20'
            )}
        >
            {/* Icon */}
            <div
                className={cn(
                    'mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                    event.severity === 'high'
                        ? 'bg-rose-500/15 text-rose-400'
                        : event.severity === 'medium'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-slate-500/15 text-slate-400'
                )}
            >
                <Icon size={14} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-200">{meta.label}</span>
                    <Badge variant={badgeVariant}>{event.severity}</Badge>
                    {event.is_suspicious && (
                        <Badge variant="rose" className="text-[10px]">
                            suspicious
                        </Badge>
                    )}
                </div>

                {/* Confidence bar */}
                {confidence != null && (
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 shrink-0">
                            Confidence
                        </span>
                        <div className="flex-1 h-1 bg-[#2a2a3a] rounded-full overflow-hidden max-w-[80px]">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${confidence}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className={cn(
                                    'h-full rounded-full',
                                    confidence >= 80
                                        ? 'bg-rose-500'
                                        : confidence >= 50
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-500'
                                )}
                            />
                        </div>
                        <span
                            className={cn(
                                'text-[11px] font-medium tabular-nums',
                                confidence >= 80
                                    ? 'text-rose-400'
                                    : confidence >= 50
                                        ? 'text-amber-400'
                                        : 'text-emerald-400'
                            )}
                        >
                            {confidence}%
                        </span>
                    </div>
                )}
            </div>

            {/* Timestamp */}
            <span className="text-[11px] text-slate-500 shrink-0 tabular-nums mt-0.5">
                {formatTime(event.created_at)}
            </span>
        </motion.div>
    )
})

// ---------------------------------------------------------------------------
// Feed container
// ---------------------------------------------------------------------------

interface LiveEventFeedProps {
    /** Filter to only show events for a specific session */
    sessionId?: string
    /** Max items to render (default 20) */
    maxItems?: number
    className?: string
}

export function LiveEventFeed({
    sessionId,
    maxItems = 20,
    className,
}: LiveEventFeedProps) {
    const allEvents = useMonitoringStore((s) => s.liveEvents)

    const events = sessionId
        ? allEvents.filter((e) => e.session_id === sessionId)
        : allEvents

    const visible = events.slice(0, maxItems)

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <h2 className="text-base font-semibold text-white">
                            Live Activity Feed
                        </h2>
                    </div>
                    {visible.length > 0 && (
                        <span className="text-xs text-slate-500 tabular-nums">
                            {visible.length} event{visible.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </CardHeader>

            <CardBody className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
                {visible.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-600 space-y-2">
                        <AlertTriangle size={24} className="opacity-40" />
                        <p className="text-sm">No events yet — monitoring is active.</p>
                    </div>
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
