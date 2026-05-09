import type { EventType } from './types'

/**
 * CooldownManager — prevents the same event type from firing repeatedly
 * within a configured window.
 *
 * Completely stateless with respect to React — plain class, no hooks.
 */
export class CooldownManager {
    private readonly lastFiredAt = new Map<EventType, number>()
    private readonly cooldowns: Record<EventType, number>

    constructor(cooldowns: Record<EventType, number>) {
        this.cooldowns = cooldowns
    }

    /**
     * Returns true if the event type is allowed to fire right now.
     * Calling this does NOT consume the cooldown — call `consume()` after
     * you have confirmed the event will be dispatched.
     */
    isReady(type: EventType): boolean {
        const last = this.lastFiredAt.get(type) ?? 0
        return Date.now() - last >= this.cooldowns[type]
    }

    /**
     * Mark the event type as just fired, starting its cooldown window.
     */
    consume(type: EventType): void {
        this.lastFiredAt.set(type, Date.now())
    }

    /**
     * Convenience: check + consume in one call.
     * Returns true if the event was allowed (and cooldown was consumed).
     */
    tryConsume(type: EventType): boolean {
        if (!this.isReady(type)) return false
        this.consume(type)
        return true
    }

    /** Reset all cooldowns (e.g. when a session ends). */
    reset(): void {
        this.lastFiredAt.clear()
    }

    /** Override a single cooldown at runtime. */
    setCooldown(type: EventType, ms: number): void {
        this.cooldowns[type] = ms
    }
}
