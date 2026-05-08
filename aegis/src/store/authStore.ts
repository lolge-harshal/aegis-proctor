import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'admin' | 'proctor' | 'candidate'

export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    avatarUrl?: string
}

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => void
    setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,

            login: async (email: string, _password: string) => {
                set({ isLoading: true })
                // Simulate API call
                await new Promise((r) => setTimeout(r, 1200))
                const mockUser: User = {
                    id: '1',
                    name: 'Alex Morgan',
                    email,
                    role: 'proctor',
                }
                set({
                    user: mockUser,
                    token: 'mock-jwt-token',
                    isAuthenticated: true,
                    isLoading: false,
                })
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false })
            },

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'aegis-auth',
            partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
        }
    )
)
