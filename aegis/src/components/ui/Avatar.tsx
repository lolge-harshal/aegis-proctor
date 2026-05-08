import { cn } from '@/lib/utils'

interface AvatarProps {
    name: string
    src?: string
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const sizeMap = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={cn('rounded-full object-cover ring-2 ring-[#2a2a3a]', sizeMap[size], className)}
            />
        )
    }

    return (
        <div
            className={cn(
                'rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-semibold text-white ring-2 ring-[#2a2a3a]',
                sizeMap[size],
                className
            )}
        >
            {getInitials(name)}
        </div>
    )
}
