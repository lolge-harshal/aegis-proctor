import type {
    EngineEventMap,
    EngineEventType,
    EngineListener,
    MonitoringEvent,
    EngineStatus,
    FaceFrame,
} from './types'

/**
 * EventDispatcher — typed pub/sub bus for the monitoring engine.
 *
 * Intentionally framework-agnostic. React hooks subscribe via useEffect
 * and unsubscribe on cleanup. The Supabase bridge also subscribes here.
 */
export class EventDispatcher {
    private readonly listeners = new Map<EngineEventType, Set<EngineListener<EngineEventType>>>()

    on<K extends EngineEventType>(event: K, listener: EngineListener<K>): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set())
        }
        const set = this.listeners.get(event)!
        set.add(listener as EngineListener<EngineEventType>)

        // Return an unsubscribe function
        return () => {
            set.delete(listener as EngineListener<EngineEventType>)
        }
    }

    off<K extends EngineEventType>(event: K, listener: EngineListener<K>): void {
        this.listeners.get(event)?.delete(listener as EngineListener<EngineEventType>)
    }

    emit<K extends EngineEventType>(event: K, payload: EngineEventMap[K]): void {
        this.listeners.get(event)?.forEach((fn) => {
            try {
                fn(payload)
            } catch (err) {
                console.error(`[EventDispatcher] Listener error on "${event}":`, err)
            }
        })
    }

    /** Convenience typed emitters */
    emitEvent(event: MonitoringEvent): void {
        this.emit('event', event)
    }

    emitStatus(status: EngineStatus): void {
        this.emit('status-change', status)
    }

    emitFrame(frame: FaceFrame | null): void {
        this.emit('frame', frame)
    }

    /** Remove all listeners — call on engine destroy. */
    clear(): void {
        this.listeners.clear()
    }
}
