import type { DetectionResult } from '../types'

/**
 * Fullscreen exit detection rule.
 *
 * The engine listens for `fullscreenchange` / `webkitfullscreenchange`
 * and calls this when the event fires.
 */

/**
 * Returns a DetectionResult when the document exits fullscreen.
 * Returns null when entering fullscreen (not suspicious).
 */
export function checkFullscreenExit(): DetectionResult | null {
    const isFullscreen =
        !!document.fullscreenElement ||
        !!(document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement

    // Only flag the EXIT (not the enter)
    if (isFullscreen) return null

    return {
        eventType: 'fullscreen_exit',
        severity: 'medium',
        confidence: 1,
        snapshot: {
            fullscreen: false,
        },
    }
}

/**
 * Request fullscreen on an element (convenience — used by the UI to
 * enter fullscreen at session start).
 */
export async function requestFullscreen(el: Element = document.documentElement): Promise<void> {
    if (document.fullscreenElement) return
    try {
        if (el.requestFullscreen) {
            await el.requestFullscreen()
        } else {
            // Safari
            const safariEl = el as Element & { webkitRequestFullscreen?: () => Promise<void> }
            await safariEl.webkitRequestFullscreen?.()
        }
    } catch {
        // User denied or browser blocked — non-fatal
    }
}

export function isCurrentlyFullscreen(): boolean {
    return (
        !!document.fullscreenElement ||
        !!(document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement
    )
}
