import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface SpinnerProps {
    size?: number
    className?: string
}

export function Spinner({ size = 20, className }: SpinnerProps) {
    return <Loader2 size={size} className={cn('animate-spin text-indigo-400', className)} />
}

export function PageSpinner() {
    return (
        <div className="flex items-center justify-center h-64">
            <Spinner size={28} />
        </div>
    )
}
