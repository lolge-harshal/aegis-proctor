import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Shield, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { updatePassword } from '@/services/supabase'

export function UpdatePasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!password) {
            setError('Password is required.')
            return
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.')
            return
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setIsLoading(true)
        try {
            const { error: updateError } = await updatePassword(password)
            if (updateError) {
                setError(updateError.message)
            } else {
                setSuccess(true)
                // Redirect to login after a short delay
                setTimeout(() => navigate('/auth/login', { replace: true }), 2500)
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="space-y-6">
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-600/30">
                            <CheckCircle size={26} className="text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Password updated</h1>
                        <p className="text-slate-500 text-sm mt-1">You can now sign in with your new password</p>
                    </div>
                </div>
                <div className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-6 text-center space-y-4">
                    <p className="text-slate-400 text-sm">Redirecting you to sign in...</p>
                    <Link to="/auth/login">
                        <Button variant="secondary" className="w-full justify-center">
                            Go to sign in
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-600/30">
                            <Shield size={26} className="text-white" />
                        </div>
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 blur-xl opacity-40 -z-10" />
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Set new password</h1>
                    <p className="text-slate-500 text-sm mt-1">Choose a strong password for your account</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-6 space-y-5 shadow-2xl shadow-black/40">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Password with show/hide */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-300">New password</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-150 pointer-events-none">
                                <Lock size={14} />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Min. 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                className="w-full bg-[#16161f] border border-[#2a2a3a] rounded-lg pl-9 pr-10 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10 focus:bg-[#18181f] hover:border-[#3a3a4a] hover:bg-[#17171e] transition-all duration-150"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>

                    <Input
                        label="Confirm new password"
                        type="password"
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        icon={<Lock size={14} />}
                        autoComplete="new-password"
                    />

                    {/* Password strength hint */}
                    {password.length > 0 && (
                        <div className="flex gap-1">
                            {[1, 2, 3, 4].map((level) => {
                                const strength = Math.min(
                                    Math.floor(password.length / 3) +
                                    (/[A-Z]/.test(password) ? 1 : 0) +
                                    (/[0-9]/.test(password) ? 1 : 0) +
                                    (/[^A-Za-z0-9]/.test(password) ? 1 : 0),
                                    4
                                )
                                return (
                                    <div
                                        key={level}
                                        className={cn(
                                            'h-1 flex-1 rounded-full transition-colors duration-200',
                                            level <= strength
                                                ? strength <= 1 ? 'bg-rose-500'
                                                    : strength <= 2 ? 'bg-amber-500'
                                                        : strength <= 3 ? 'bg-yellow-400'
                                                            : 'bg-emerald-500'
                                                : 'bg-[#2a2a3a]'
                                        )}
                                    />
                                )
                            })}
                        </div>
                    )}

                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5"
                            >
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <Button
                        type="submit"
                        loading={isLoading}
                        className="w-full justify-center py-2.5"
                        size="lg"
                    >
                        {isLoading ? 'Updating...' : 'Update password'}
                    </Button>
                </form>
            </div>
        </div>
    )
}

// cn utility inline to avoid import issues in this file
function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ')
}
