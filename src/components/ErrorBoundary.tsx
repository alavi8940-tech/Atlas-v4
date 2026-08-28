/**
 * ErrorBoundary — جلوگیری از unmount شدن کل اپلیکیشن هنگام کرش یک بخش
 * در صورت خطای runtime، یک صفحهٔ بازیابی به جای فروپاشی کل رابط نشان میدهد.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Atlas crashed:', error, info.componentStack)
  }

  private reset = (): void => this.setState({ error: null })

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center" dir="rtl" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
          <div className="text-4xl">⚠️</div>
          <h1 className="text-lg font-bold">یه ایرادی پیش اومد</h1>
          <p className="max-w-md text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {this.state.error.message}
          </p>
          <div className="flex gap-2">
            <button onClick={this.reset} className="rounded-xl px-4 py-2 text-xs text-white" style={{ background: 'var(--accent)' }}>
              تلاش دوباره
            </button>
            <button onClick={() => location.reload()} className="rounded-xl px-4 py-2 text-xs glass glass-hover">
              بارگذاری مجدد
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
