import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Shield, UserCheck, Video } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { upsertProfile } from '@/services/supabase'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/store/authStore'

// ---------------------------------------------------------------------------
// Role selector card
// ---------------------------------------------------------------------------

interface RoleCardProps {
    selected: boolean
    onSelect: () => void
    icon: React.ReactNode
    title: string
    description: string
}

function RoleCard({ selected, onSelect, icon, title, description }: RoleCardProps) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                'flex-1 flex flex-col items-center gap-2 px-4 py-4 rounded-xl border transition-all duration-150 text-left',
                selected
                    ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-300'
                    : 'border-[#2a2a3a] bg-[#0e0e16] text-slate-400 hover:border-[#3a3a4a] hover:text-slate-300'
            )}
            aria-pressed={selected}
            aria-label={`Sign in as ${title}`}
        >
            <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                selected ? 'bg-indigo-500/20' : 'bg-[#1c1c28]'
            )}>
                {icon}
            </div>
            <div className="text-center">
                <p className={cn('text-sm font-semibold', selected ? 'text-indigo-300' : 'text-slate-300')}>
                    {title}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{description}</p>
            </div>
            {selected && (
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-0.5" />
            )}
        </button>
    )
}

// ---------------------------------------------------------------------------
// LoginPage
// ---------------------------------------------------------------------------

export function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [selectedRole, setSelectedRole] = useState<UserRole>('proctor')
    const [localError, setLocalError] = useState('')

    const { login, isLoading, error: authError, clearError } = useAuth()
    const setUserFromSession = useAuthStore((s) => s.setUserFromSession)
    const navigate = useNavigate()
    const location = useLocation()
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

    // Show either a local validation error or the error from the auth store
    const displayError = localError || authError

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError('')
        clearError()

        if (!email || !password) {
            setLocalError('Please fill in all fields.')
            return
        }

        try {
            await login(email, password)

            // After login, update the profile role to the selected role.
            // useAuthInit will have set the user by now via onAuthStateChange,
            // but we also update the store directly so the UI reflects the
            // chosen role immediately without waiting for a re-fetch.
            const currentUser = useAuthStore.getState().user
            if (currentUser) {
                // Persist role to DB
                await upsertProfile({ id: currentUser.id, role: selectedRole })
                // Update store immediately
                setUserFromSession({ ...currentUser, role: selectedRole })
            }

            navigate(from, { replace: true })
        } catch {
            // Error is already stored in authStore.error — no extra handling needed
        }
    }

    return (
        <div className="space-y-8">
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
                    <h1 className="text-2xl font-bold text-white">Welcome to Aegis</h1>
                    <p className="text-slate-500 text-sm mt-1">AI-powered proctoring platform</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-6 space-y-5 shadow-2xl shadow-black/40">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Role selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Sign in as
                        </label>
                        <div className="flex gap-3">
                            <RoleCard
                                selected={selectedRole === 'proctor'}
                                onSelect={() => setSelectedRole('proctor')}
                                icon={<UserCheck size={18} className={selectedRole === 'proctor' ? 'text-indigo-400' : 'text-slate-500'} />}
                                title="Proctor"
                                description="Monitor exam sessions"
                            />
                            <RoleCard
                                selected={selectedRole === 'candidate'}
                                onSelect={() => setSelectedRole('candidate')}
                                icon={<Video size={18} className={selectedRole === 'candidate' ? 'text-indigo-400' : 'text-slate-500'} />}
                                title="Candidate"
                                description="Take a proctored exam"
                            />
                        </div>
                    </div>

                    <Input
                        label="Email address"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<Mail size={14} />}
                        autoComplete="email"
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        icon={<Lock size={14} />}
                        autoComplete="current-password"
                    />

                    <AnimatePresence>
                        {displayError && (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5"
                            >
                                {displayError}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <Button
                        type="submit"
                        loading={isLoading}
                        className="w-full justify-center py-2.5"
                        size="lg"
                    >
                        {isLoading
                            ? 'Signing in...'
                            : `Sign in as ${selectedRole === 'candidate' ? 'Candidate' : 'Proctor'}`}
                    </Button>
                </form>

                <div className="text-center">
                    <a href="#" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                        Forgot your password?
                    </a>
                </div>
            </div>

            <p className="text-center text-xs text-slate-700">
                Protected by Aegis AI · End-to-end encrypted
            </p>
        </div>
    )
}
