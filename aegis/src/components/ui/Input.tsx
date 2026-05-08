import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, className, ...props }, ref) => {
        return (
            <div className="space-y-1.5">
                {label && (
                    <label className="block text-sm font-medium text-slate-300">{label}</label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</div>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            'w-full bg-[#16161f] border border-[#2a2a3a] rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500',
                            'focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10 transition-all',
                            error && 'border-rose-500/50 focus:border-rose-500/60 focus:ring-rose-500/10',
                            icon ? 'pl-9' : undefined,
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && <p className="text-xs text-rose-400">{error}</p>}
            </div>
        )
    }
)

Input.displayName = 'Input'
