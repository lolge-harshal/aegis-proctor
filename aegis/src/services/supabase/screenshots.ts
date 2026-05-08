/**
 * Screenshot service — upload to Storage + persist metadata.
 * Storage path convention: screenshots/{sessionId}/{timestamp}.jpg
 */

import { supabase } from './client'
import type { ScreenshotRow, ScreenshotInsert } from './types'

const BUCKET = 'screenshots'

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

/**
 * Upload a screenshot blob and return the public-signed URL.
 * Files are stored at: screenshots/{sessionId}/{timestamp}.jpg
 */
export async function uploadScreenshot(
    sessionId: string,
    blob: Blob,
    eventId?: string,
): Promise<{ storagePath: string; imageUrl: string; row: ScreenshotRow }> {
    const timestamp = Date.now()
    const storagePath = `${sessionId}/${timestamp}.jpg`

    // 1. Upload to Storage
    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
        })

    if (uploadError) throw uploadError

    // 2. Create a signed URL valid for 1 hour (private bucket)
    const { data: signedData, error: signedError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, 3600)

    if (signedError) throw signedError

    const imageUrl = signedData.signedUrl

    // 3. Persist metadata row
    const row = await insertScreenshotRecord({
        session_id: sessionId,
        event_id: eventId ?? null,
        image_url: imageUrl,
        storage_path: storagePath,
    })

    return { storagePath, imageUrl, row }
}

/**
 * Generate a fresh signed URL for an existing screenshot.
 * Call this when a stored URL has expired.
 */
export async function refreshSignedUrl(
    storagePath: string,
    expiresIn: number = 3600,
): Promise<string> {
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, expiresIn)

    if (error) throw error
    return data.signedUrl
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

/** Insert a screenshot metadata record. */
async function insertScreenshotRecord(
    payload: ScreenshotInsert,
): Promise<ScreenshotRow> {
    const { data, error } = await supabase
        .from('screenshots')
        .insert(payload)
        .select()
        .single()

    if (error) throw error
    return data
}

/** Fetch all screenshot records for a session. */
export async function getSessionScreenshots(sessionId: string): Promise<ScreenshotRow[]> {
    const { data, error } = await supabase
        .from('screenshots')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}
