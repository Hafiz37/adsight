import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 m-4">
          <h3 className="text-red-400 font-semibold mb-2">Terjadi Error</h3>
          <pre className="text-red-300 text-sm whitespace-pre-wrap">{this.state.error?.message || 'Unknown error'}</pre>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }) }}
            className="mt-3 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )
    }
    return this.props.children
  }
}