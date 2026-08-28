import { describe, it, expect } from 'vitest'
import { formatBackendActivity } from '@/stores/activityStore'

describe('formatBackendActivity', () => {
  it('یک رکورد فعالیت پروسهٔ اصلی را به ورودی استور نگاشت می‌کند', () => {
    const entry = formatBackendActivity({
      tool: 'shell_exec',
      args: { command: 'ls -la' },
      result: { ok: true, stdout: 'x' },
      ts: 123,
    })
    expect(entry.tool).toBe('shell_exec')
    expect(entry.ts).toBe(123)
    expect((entry.args as { command: string }).command).toBe('ls -la')
    expect(entry.id.startsWith('a')).toBe(true)
  })

  it('خطاها را بدون ازدست‌دادن فیلدها حفظ می‌کند', () => {
    const entry = formatBackendActivity({ tool: 'fs_read', error: 'دسترسی ممنوع', ts: 9 })
    expect(entry.error).toBe('دسترسی ممنوع')
    expect(entry.result).toBeUndefined()
  })
})
