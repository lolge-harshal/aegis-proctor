import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Shield,
    Video,
    UserCheck,
    Eye,
    AlertTriangle,
    BarChart3,
    CheckCircle,
    ArrowRight,
    Monitor,
    Camera,
    Wifi,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

interface Step {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    items: { icon: React.ReactNode; text: string }[]
}

const CANDIDATE_STEPS: Step[] = [
    {
        id: 'welcome',
        title: 'Welcome, Candidate',
        description: "You're about to take a proctored exam. Here's what to expect.",
        icon: <Video size={28} className="text-white" />,
        items: [
            { icon: <Camera size={15} className="text-indigo-400 shrink-0" />, text: 'Your webcam will be monitored throughout the session' },
            { icon: <Monitor size={15} className="text-indigo-400 shrink-0" />, text: 'Stay in fullscreen mode — exiting will be flagged' },
            { icon: <Eye size={15} className="text-indigo-400 shrink-0" />, text: 'AI monitors for suspicious behavior in real time' },
        ],
    },
    {
        id: 'rules',
        title: 'Exam rules',
        description: 'Follow these guidelines to avoid violations.',
        icon: <AlertTriangle size={28} className="text-white" />,
        items: [
            { icon: <CheckCircle size={15} className="text-emerald-400 shrink-0" />, text: 'Keep your face visible and centered in the camera' },
            { icon: <CheckCircle size={15} className="text-emerald-400 shrink-0" />, text: 'Do not switch tabs or open other applications' },
            { icon: <CheckCircle size={15} className="text-emerald-400 shrink-0" />, text: 'Ensure good lighting and a quiet environment' },
        ],
    },
    {
        id: 'ready',
        title: "You're all set",
        description: 'Your session will begin when you click Start Exam.',
        icon: <CheckCircle size={28} className="text-white" />,
        items: [
            { icon: <Wifi size={15} className="text-cyan-400 shrink-0" />, text: 'Stable internet connection recommended' },
            { icon: <Camera size={15} className="text-cyan-400 shrink-0" />, text: 'Allow camera and microphone access when prompted' },
            { icon: <Monitor size={15} className="text-cyan-400 shrink-0" />, text: 'Use a desktop or laptop for the best experience' },
        ],
    },
]

const PROCTOR_STEPS: Step[] = [
    {
        id: 'welcome',
        title: 'Welcome, Proctor',
        description: "You're set up to monitor exam sessions with Aegis AI.",
        icon: <UserCheck size={28} className="text-white" />,
        items: [
            { icon: <Eye size={15} className="text-indigo-400 shrink-0" />, text: 'Monitor live sessions from the dashboard' },
            { icon: <AlertTriangle size={15} className="text-indigo-400 shrink-0" />, text: 'AI flags suspicious events automatically' },
            { icon: <BarChart3 size={15} className="text-indigo-400 shrink-0" />, text: 'Review detailed reports after each session' },
        ],
    },
    {
        id: 'features',
        title: 'Key features',
        description: 'Everything you need to run a fair exam.',
        icon: <Shield size={28} className="text-white" />,
        items: [
            { icon: <CheckCircle size={15} className="text-emerald-400 shrink-0" />, text: 'Real-time risk scoring per candidate' },
            { icon: <CheckCircle size={15} className="text-emerald-400 shrink-0" />, text: 'Live event feed with severity levels' },
            { icon: <CheckCircle size={15} className="text-emerald-400 shrink-0" />, text: 'Screenshot capture on suspicious events' },
        ],
    },
    {
        id: 'ready',
        title: "You're ready",
        description: 'Head to the dashboard to start monitoring.',
        icon: <CheckCircle size={28} className="text-white" />,
        items: [
            { icon: <BarChart3 size={15} className="text-cyan-400 shrink-0" />, text: 'Dashboard shows all active sessions at a glance' },
            { icon: <Eye size={15} className="text-cyan-400 shrink-0" />, text: 'Click any session to view the live feed' },
            { icon: <AlertTriangle size={15} className="text-cyan-400 shrink-0" />, text: 'High-risk events are highlighted in red' },
        ],
    },
]

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepDots({ total, current }: { total: number; current: number }) {
    return (
        <div className="flex items-center gap-2 justify-center">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        'rounded-full transition-all duration-300',
                        i === current
                            ? 'w-5 h-1.5 bg-indigo-400'
                            : i < current
                                ? 'w-1.5 h-1.5 bg-indigo-600'
                                : 'w-1.5 h-1.5 bg-[#2a2a3a]'
                    )}
                />
            ))}
        </div>
    )
}

// ---------------------------------------------------------------------------
// OnboardingPage
// ---------------------------------------------------------------------------

export function OnboardingPage() {
    const [stepIndex, setStepIndex] = useState(0)
    const user = useAuthStore((s) => s.user)
    const navigate = useNavigate()

    const steps = user?.role === 'proctor' ? PROCTOR_STEPS : CANDIDATE_STEPS
    const step = steps[stepIndex]
    const isLast = stepIndex === steps.length - 1

    const handleNext = () => {
        if (isLast) {
            // Navigate to the role-appropriate destination
            if (user?.role === 'proctor' || user?.role === 'admin') {
                navigate('/dashboard', { replace: true })
            } else {
                navigate('/session/live', { replace: true })
            }
        } else {
            setStepIndex((i) => i + 1)
        }
    }

    const gradientMap: Record<string, string> = {
        welcome: 'from-indigo-500 to-violet-600',
        rules: 'from-amber-500 to-orange-600',
        features: 'from-indigo-500 to-violet-600',
        ready: 'from-emerald-500 to-teal-600',
    }

    const gradient = gradientMap[step.id] ?? 'from-indigo-500 to-violet-600'

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden px-4 py-8">
            {/* Background glows */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/6 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/6 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="space-y-6"
                    >
                        {/* Icon + title */}
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <div className="relative">
                                    <div className={cn(
                                        'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-xl',
                                        gradient
                                    )}>
                                        {step.icon}
                                    </div>
                                    <div className={cn(
                                        'absolute inset-0 rounded-2xl bg-gradient-to-br blur-xl opacity-40 -z-10',
                                        gradient
                                    )} />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{step.title}</h1>
                                <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">{step.description}</p>
                            </div>
                        </div>

                        {/* Content card */}
                        <div className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-6 space-y-3 shadow-2xl shadow-black/40">
                            {step.items.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 + 0.1 }}
                                    className="flex items-start gap-3 p-3 rounded-xl bg-[#0e0e16] border border-[#2a2a3a]"
                                >
                                    <div className="mt-0.5">{item.icon}</div>
                                    <p className="text-sm text-slate-300 leading-relaxed">{item.text}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="space-y-4">
                            <Button
                                onClick={handleNext}
                                className="w-full justify-center py-2.5"
                                size="lg"
                                icon={isLast ? undefined : <ArrowRight size={16} />}
                            >
                                {isLast
                                    ? user?.role === 'candidate' ? 'Go to my exam' : 'Go to dashboard'
                                    : 'Continue'}
                            </Button>

                            <StepDots total={steps.length} current={stepIndex} />

                            {stepIndex > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setStepIndex((i) => i - 1)}
                                    className="w-full text-center text-sm text-slate-600 hover:text-slate-400 transition-colors"
                                >
                                    Back
                                </button>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
