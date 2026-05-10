import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface SpinnerProps {
    size?: number
    className?: string
}

export function Spinner({ size = 20, className }: SpinnerProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={cn('animate-spin', className)}
            aria-label="Loading"
        >
            <circle
                cx="12" cy="12" r="10"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="text-[#2a2a3a]"
            />
            <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="text-indigo-400"
            />
        </svg>
    )
}

export function PageSpinner() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center h-64 gap-3"
        >
            <Spinner size={32} />
            <p className="text-xs text-slate-600 animate-pulse">Loading...</p>
        </motion.div>
    )
}
