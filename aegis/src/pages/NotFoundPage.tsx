import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Home } from 'lucide-react'

export function NotFoundPage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-5"
            >
                <p className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-violet-600">
                    404
                </p>
                <div>
                    <h1 className="text-2xl font-bold text-white">Page not found</h1>
                    <p className="text-slate-400 mt-1">The page you're looking for doesn't exist.</p>
                </div>
                <Button icon={<Home size={15} />} onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                </Button>
            </motion.div>
        </div>
    )
}
