import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[renderer] uncaught error', error, info)
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="fatal-screen">
          <div className="fatal-card">
            <div className="fatal-mark">!</div>
            <div className="fatal-title">Something went wrong</div>
            <div className="fatal-text">
              Presence Studio の画面で予期しないエラーが発生しました。データは自動保存されています。
            </div>
            <pre className="fatal-error">{this.state.error.message}</pre>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              画面を再読み込み
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
