import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Shield, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { sendPasswordResetEmail } from '@/services/supabase'

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!email.trim()) {
            setError('Email is required.')
            return
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError('Enter a valid email address.')
            return
        }

        setIsLoading(true)
        try {
            const { error: resetError } = await sendPasswordResetEmail(email.trim())
            if (resetError) {
                setError(resetError.message)
            } else {
                setSent(true)
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (sent) {
        return (
            <div className="space-y-6">
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-600/30">
                            <CheckCircle size={26} className="text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Email sent</h1>
                        <p className="text-slate-500 text-sm mt-1">Check your inbox for the reset link</p>
                    </div>
                </div>

                <div className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-6 space-y-4">
                    <p className="text-slate-400 text-sm leading-relaxed text-center">
                        We sent a password reset link to{' '}
                        <span className="text-indigo-400 font-medium">{email}</span>.
                        The link expires in 1 hour.
                    </p>
                    <p className="text-slate-600 text-xs text-center">
                        Didn't receive it? Check your spam folder or try again.
                    </p>
                    <div className="flex flex-col gap-2 pt-1">
                        <Button
                            variant="secondary"
                            className="w-full justify-center"
                            onClick={() => setSent(false)}
                        >
                            Try a different email
                        </Button>
                        <Link to="/auth/login">
                            <Button variant="ghost" className="w-full justify-center" icon={<ArrowLeft size={14} />}>
                                Back to sign in
                            </Button>
                        </Link>
                    </div>
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
                    <h1 className="text-2xl font-bold text-white">Reset password</h1>
                    <p className="text-slate-500 text-sm mt-1">We'll send you a link to reset it</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-6 space-y-5 shadow-2xl shadow-black/40">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Email address"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<Mail size={14} />}
                        autoComplete="email"
                    />

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
                        {isLoading ? 'Sending...' : 'Send reset link'}
                    </Button>
                </form>

                <div className="text-center">
                    <Link
                        to="/auth/login"
                        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <ArrowLeft size={13} />
                        Back to sign in
                    </Link>
                </div>
            </div>
        </div>
    )
}
