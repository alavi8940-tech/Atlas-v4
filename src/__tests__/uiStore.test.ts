import { describe, it, expect } from 'vitest'
import { useUiStore } from '@/stores/uiStore'

describe('useUiStore (پنل‌های رابط)', () => {
  it('بین چت/مرورگر/ترمینال سوییچ می‌کند', () => {
    const s = useUiStore.getState()
    s.setPanel('chat')
    expect(useUiStore.getState().panel).toBe('chat')

    s.openBrowser('https://example.com')
    expect(useUiStore.getState().panel).toBe('browser')
    expect(useUiStore.getState().browserUrl).toBe('https://example.com')

    s.openTerminal()
    expect(useUiStore.getState().panel).toBe('terminal')

    s.setPanel('chat')
    expect(useUiStore.getState().panel).toBe('chat')
  })
})
