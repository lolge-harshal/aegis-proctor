/**
 * CSV export utilities — browser-side, no dependencies.
 */

/** Convert an array of objects to a CSV string and trigger a download. */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
    if (rows.length === 0) return

    const headers = Object.keys(rows[0])
    const escape = (val: unknown): string => {
        const str = val == null ? '' : String(val)
        // Wrap in quotes if it contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
        }
        return str
    }

    const csvLines = [
        headers.join(','),
        ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
    ]

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}
