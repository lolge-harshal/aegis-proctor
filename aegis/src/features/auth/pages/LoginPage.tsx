import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginPage() {
    const [email, setEmail] = useState('proctor@aegis.ai')
    const [password, setPassword] = useState('password')
    const [error, setError] = useState('')

    const login = useAuthStore((s) => s.login)
    const isLoading = useAuthStore((s) => s.isLoading)
    const navigate = useNavigate()
    const location = useLocation()
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (!email || !password) {
            setError('Please fill in all fields.')
            return
        }
        try {
            await login(email, password)
            navigate(from, { replace: true })
        } catch {
            setError('Invalid credentials. Please try again.')
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
                <div className="flex justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-600/30">
                        <Shield size={28} className="text-white" />
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Welcome to Aegis</h1>
                    <p className="text-slate-400 text-sm mt-1">AI-powered proctoring platform</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-6 space-y-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Email address"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<Mail size={15} />}
                        autoComplete="email"
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        icon={<Lock size={15} />}
                        autoComplete="current-password"
                    />

                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2"
                        >
                            {error}
                        </motion.p>
                    )}

                    <Button
                        type="submit"
                        loading={isLoading}
                        className="w-full justify-center py-2.5"
                        size="lg"
                    >
                        {isLoading ? 'Signing in...' : 'Sign in'}
                    </Button>
                </form>

                <div className="text-center">
                    <a href="#" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                        Forgot your password?
                    </a>
                </div>
            </div>

            <p className="text-center text-xs text-slate-500">
                Protected by Aegis AI · End-to-end encrypted
            </p>
        </div>
    )
}
