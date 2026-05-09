import type { DetectionResult } from '../types'

/**
 * Tab-switch detection rule.
 *
 * Uses the Page Visibility API (document.visibilityState).
 * The engine calls this when a `visibilitychange` event fires — not on
 * every detection frame, so no frame data is needed.
 */

/**
 * Returns a DetectionResult when the document becomes hidden.
 * Returns null when the document becomes visible again (not suspicious).
 */
export function checkTabSwitch(): DetectionResult | null {
    if (document.visibilityState !== 'hidden') return null

    return {
        eventType: 'tab_switch',
        severity: 'medium',
        confidence: 1,
        snapshot: {
            tabVisible: false,
        },
    }
}
