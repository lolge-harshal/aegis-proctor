/**
 * LiveSessionPage — role-aware session view.
 *
 * candidate  → camera feed + AI monitoring engine (self-monitoring)
 * proctor / admin → participant monitor grid + live realtime event feed
 */

import { useAuthStore } from '@/store/authStore'
import { CandidateSessionView } from './CandidateSessionView'
import { ProctorSessionView } from './ProctorSessionView'

export function LiveSessionPage() {
    const role = useAuthStore((s) => s.user?.role)

    if (role === 'candidate') {
        return <CandidateSessionView />
    }

    return <ProctorSessionView />
}
