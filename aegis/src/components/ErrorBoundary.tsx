import { Component, type ReactNode } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: { componentStack: string }) {
        console.error('[ErrorBoundary]', error, info)
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback ?? (
                    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                        <div className="text-center space-y-4 p-8">
                            <div className="text-5xl">⚠️</div>
                            <h1 className="text-2xl font-semibold text-white">Something went wrong</h1>
                            <p className="text-slate-400 max-w-sm">
                                {this.state.error?.message ?? 'An unexpected error occurred.'}
                            </p>
                            <button
                                onClick={() => this.setState({ hasError: false, error: null })}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                )
            )
        }
        return this.props.children
    }
}
