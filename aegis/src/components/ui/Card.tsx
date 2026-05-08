import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CardProps {
    children: ReactNode
    className?: string
    hover?: boolean
}

export function Card({ children, className, hover = false }: CardProps) {
    return (
        <div
            className={cn(
                'bg-[#16161f] border border-[#2a2a3a] rounded-xl',
                hover && 'hover:border-[#3a3a4a] hover:bg-[#1a1a26] transition-all duration-200 cursor-pointer',
                className
            )}
        >
            {children}
        </div>
    )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('px-5 py-4 border-b border-[#2a2a3a]', className)}>{children}</div>
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('px-5 py-4', className)}>{children}</div>
}
