import { describe, it, expect } from 'vitest'
import { useActivityStore } from '@/stores/activityStore'
import { useConversationsStore } from '@/stores/conversationsStore'

describe('activityStore — محدودیت حافظهٔ اسکرین‌شات', () => {
  it('اسکرین‌شاتهای قدیمی‌تر از ۵ تا را از حافظه پاک میکند', () => {
    const store = useActivityStore.getState()
    store.clear()
    for (let i = 0; i < 12; i++) {
      store.push({ id: `s${i}`, tool: 'screen_capture', ts: Date.now() + i, screenshot: `data:img${i}` })
    }
    const entries = useActivityStore.getState().entries
    expect(entries.length).toBe(12)
    const withShot = entries.filter(e => e.screenshot).length
    expect(withShot).toBeLessThanOrEqual(5)
    // جدیدترین‌ها (ایندکس ۰) اسکرین‌شات را حفظ میکنند
    expect(entries[0].screenshot).toBeTruthy()
  })
})

describe('conversationsStore — ساخت مکالمه', () => {
  it('شناسهٔ یکتا برمیگرداند و به لیست اضافه میکند', () => {
    const before = useConversationsStore.getState().conversations.length
    const id = useConversationsStore.getState().create()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(3)
    const after = useConversationsStore.getState().conversations
    expect(after.length).toBe(before + 1)
    expect(after.some(c => c.id === id)).toBe(true)
  })
})
