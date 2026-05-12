import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Shield, UserCheck, Video, User, Camera, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/services/supabase'
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
                'flex-1 flex flex-col items-center gap-2 px-3 py-3 rounded-xl border transition-all duration-150',
                selected
                    ? 'border-indigo-500/60 bg-indigo-500/10'
                    : 'border-[#2a2a3a] bg-[#0e0e16] hover:border-[#3a3a4a]'
            )}
            aria-pressed={selected}
            aria-label={`Sign up as ${title}`}
        >
            <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center',
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
            {selected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-0.5" />}
        </button>
    )
}

// ---------------------------------------------------------------------------
// Avatar upload preview
// ---------------------------------------------------------------------------

interface AvatarPickerProps {
    preview: string | null
    onFileChange: (file: File) => void
}

function AvatarPicker({ preview, onFileChange }: AvatarPickerProps) {
    const inputRef = useRef<HTMLInputElement>(null)

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-[#3a3a4a] hover:border-indigo-500/60 transition-colors group"
                aria-label="Upload avatar"
            >
                {preview ? (
                    <img src={preview} alt="Avatar preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-[#1c1c28] flex items-center justify-center">
                        <User size={22} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={14} className="text-white" />
                </div>
            </button>
            <span className="text-[11px] text-slate-600">Optional photo</span>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onFileChange(file)
                }}
            />
        </div>
    )
}

// ---------------------------------------------------------------------------
// SignupPage
// ---------------------------------------------------------------------------

type SignupRole = Extract<UserRole, 'candidate' | 'proctor'>

export function SignupPage() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [selectedRole, setSelectedRole] = useState<SignupRole>('candidate')
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [localError, setLocalError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [emailSent, setEmailSent] = useState(false)

    const { signUp, error: authError, clearError } = useAuth()
    const navigate = useNavigate()

    const displayError = localError || authError

    const handleAvatarChange = (file: File) => {
        setAvatarFile(file)
        const reader = new FileReader()
        reader.onload = (e) => setAvatarPreview(e.target?.result as string)
        reader.readAsDataURL(file)
    }

    const uploadAvatar = async (userId: string, file: File): Promise<string | undefined> => {
        const ext = file.name.split('.').pop()
        const path = `avatars/${userId}.${ext}`
        const { error } = await supabase.storage
            .from('avatars')
            .upload(path, file, { upsert: true })
        if (error) return undefined
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        return data.publicUrl
    }

    const validate = (): string | null => {
        if (!fullName.trim()) return 'Full name is required.'
        if (fullName.trim().length < 2) return 'Name must be at least 2 characters.'
        if (!email.trim()) return 'Email is required.'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.'
        if (!password) return 'Password is required.'
        if (password.length < 8) return 'Password must be at least 8 characters.'
        if (password !== confirmPassword) return 'Passwords do not match.'
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError('')
        clearError()

        const validationError = validate()
        if (validationError) {
            setLocalError(validationError)
            return
        }

        setIsSubmitting(true)
        try {
            // Sign up — profile row is created inside signUpWithEmail
            const { needsEmailConfirmation } = await signUp({
                email: email.trim(),
                password,
                fullName: fullName.trim(),
                role: selectedRole,
            })

            if (needsEmailConfirmation) {
                setEmailSent(true)
                return
            }

            // If no email confirmation needed, upload avatar then redirect to onboarding
            if (avatarFile) {
                // We need the user id — get it from the session
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    await uploadAvatar(session.user.id, avatarFile)
                }
            }

            navigate('/onboarding', { replace: true })
        } catch {
            // Error is in authStore.error
        } finally {
            setIsSubmitting(false)
        }
    }

    // ── Email confirmation sent screen ──────────────────────────────────────
    if (emailSent) {
        return (
            <div className="space-y-6">
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-600/30">
                            <Mail size={26} className="text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Check your inbox</h1>
                        <p className="text-slate-500 text-sm mt-1">We sent a confirmation link to</p>
                        <p className="text-indigo-400 text-sm font-medium mt-0.5">{email}</p>
                    </div>
                </div>
                <div className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-6 space-y-4 text-center">
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Click the link in the email to activate your account. Once confirmed, you can sign in.
                    </p>
                    <Link to="/auth/login">
                        <Button variant="secondary" className="w-full justify-center">
                            Back to sign in
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
                    <h1 className="text-2xl font-bold text-white">Create your account</h1>
                    <p className="text-slate-500 text-sm mt-1">Join Aegis AI proctoring platform</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-6 shadow-2xl shadow-black/40">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Avatar */}
                    <div className="flex justify-center pb-1">
                        <AvatarPicker preview={avatarPreview} onFileChange={handleAvatarChange} />
                    </div>

                    {/* Role selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            I am a
                        </label>
                        <div className="flex gap-3">
                            <RoleCard
                                selected={selectedRole === 'candidate'}
                                onSelect={() => setSelectedRole('candidate')}
                                icon={<Video size={18} className={selectedRole === 'candidate' ? 'text-indigo-400' : 'text-slate-500'} />}
                                title="Candidate"
                                description="Taking a proctored exam"
                            />
                            <RoleCard
                                selected={selectedRole === 'proctor'}
                                onSelect={() => setSelectedRole('proctor')}
                                icon={<UserCheck size={18} className={selectedRole === 'proctor' ? 'text-indigo-400' : 'text-slate-500'} />}
                                title="Proctor"
                                description="Monitoring exam sessions"
                            />
                        </div>
                    </div>

                    <Input
                        label="Full name"
                        type="text"
                        placeholder="Jane Smith"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        icon={<User size={14} />}
                        autoComplete="name"
                    />

                    <Input
                        label="Email address"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<Mail size={14} />}
                        autoComplete="email"
                    />

                    {/* Password with show/hide toggle */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-300">Password</label>
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
                        label="Confirm password"
                        type="password"
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        icon={<Lock size={14} />}
                        autoComplete="new-password"
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
                        loading={isSubmitting}
                        className="w-full justify-center py-2.5"
                        size="lg"
                    >
                        {isSubmitting ? 'Creating account...' : 'Create account'}
                    </Button>
                </form>

                <div className="text-center pt-4 border-t border-[#2a2a3a] mt-4">
                    <span className="text-sm text-slate-500">Already have an account? </span>
                    <Link
                        to="/auth/login"
                        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                    >
                        Sign in
                    </Link>
                </div>
            </div>

            <p className="text-center text-xs text-slate-700">
                Protected by Aegis AI · End-to-end encrypted
            </p>
        </div>
    )
}
