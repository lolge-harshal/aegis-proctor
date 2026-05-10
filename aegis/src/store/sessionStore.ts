import { create } from 'zustand'

export type SessionStatus = 'idle' | 'connecting' | 'live' | 'paused' | 'ended'

export interface Participant {
    id: string
    name: string
    status: 'active' | 'flagged' | 'disconnected'
    riskScore: number
    flags: string[]
}

interface SessionState {
    status: SessionStatus
    sessionId: string | null
    participants: Participant[]
    elapsedSeconds: number
    setStatus: (status: SessionStatus) => void
    setSessionId: (id: string) => void
    setParticipants: (participants: Participant[]) => void
    updateParticipant: (id: string, updates: Partial<Participant>) => void
    incrementElapsed: () => void
    resetSession: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
    status: 'idle',
    sessionId: null,
    participants: [],
    elapsedSeconds: 0,

    setStatus: (status) => set({ status }),
    setSessionId: (id) => set({ sessionId: id }),
    setParticipants: (participants) => set({ participants }),
    updateParticipant: (id, updates) =>
        set((s) => ({
            participants: s.participants.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
    // Use functional update so the reference is always stable — no closure over stale state
    incrementElapsed: () => set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 })),
    resetSession: () => set({ status: 'idle', sessionId: null, participants: [], elapsedSeconds: 0, }),
}))
