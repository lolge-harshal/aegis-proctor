type ClassValue = string | undefined | null | false | 0 | Record<string, boolean>

export function cn(...classes: ClassValue[]): string {
    return classes
        .flatMap((cls) => {
            if (!cls) return []
            if (typeof cls === 'string') return [cls]
            return Object.entries(cls)
                .filter(([, v]) => v)
                .map(([k]) => k)
        })
        .join(' ')
}

export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(date))
}
