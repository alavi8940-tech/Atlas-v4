/**
 * Messages Store — ذخیرهٔ پیامهای هر مکالمه (جدا از متا برای سبکی)
 * در فایل جداگانه نگه داشته شده تا با ConversationsStore قاطی نشود.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StoredThread {
  /** فرمت ExportedMessageRepository از assistant-ui */
  repository: unknown
  savedAt: number
}

interface MessagesState {
  threads: Record<string, StoredThread>
  save: (id: string, repository: unknown) => void
  load: (id: string) => StoredThread | undefined
  drop: (id: string) => void
}

export const useMessagesStore = create<MessagesState>()(
  persist(
    (set, get) => ({
      threads: {},
      save: (id, repository) =>
        set(s => ({ threads: { ...s.threads, [id]: { repository, savedAt: Date.now() } } })),
      load: id => get().threads[id],
      drop: id =>
        set(s => {
          const { [id]: _removed, ...rest } = s.threads
          return { threads: rest }
        }),
    }),
    { name: 'atlas-threads', version: 1 }
  )
)
