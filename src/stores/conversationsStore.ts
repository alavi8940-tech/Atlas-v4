/**
 * Conversations Store — مدیریت واقعی مکالمهها (ماندگار)
 * ساخت/حذف/تغییرنام/پین + گروهبندی Pinned/Today/Previous 7 days/Older
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** خلاصهٔ مکالمه برای لیست سایدبار (پیامها جدا ذخیره میشوند تا سنگین نشود) */
export interface ConversationMeta {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  pinned: boolean
  starred: boolean
}

interface ConvState {
  conversations: ConversationMeta[]
  activeId: string | null

  create: () => string
  remove: (id: string) => void
  rename: (id: string, title: string) => void
  togglePin: (id: string) => void
  toggleStar: (id: string) => void
  setActive: (id: string | null) => void
  /** اگر عنوان هنوز «مکالمهٔ جدید» است، از پیام کاربر بساز (۴۸ کاراکتر اول) */
  ensureTitle: (id: string, firstMessage: string) => void
  touch: (id: string) => void
}

function genId(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

const NEW_TITLE = 'مکالمهٔ جدید'

export const useConversationsStore = create<ConvState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,

      create: () => {
        const now = Date.now()
        const conv: ConversationMeta = {
          id: genId(), title: NEW_TITLE,
          createdAt: now, updatedAt: now,
          pinned: false, starred: false
        }
        set(s => ({ conversations: [conv, ...s.conversations], activeId: conv.id }))
        return conv.id
      },

      remove: id =>
        set(s => ({
          conversations: s.conversations.filter(c => c.id !== id),
          // آبشاری: حذف پیامهای مکالمه هم اینجا انجام میشود (messagesStore گوش میدهد)
          activeId: s.activeId === id ? null : s.activeId
        })),

      rename: (id, title) =>
        set(s => ({
          conversations: s.conversations.map(c =>
            c.id === id ? { ...c, title: title.trim().slice(0, 80), updatedAt: Date.now() } : c)
        })),

      togglePin: id =>
        set(s => ({
          conversations: s.conversations.map(c =>
            c.id === id ? { ...c, pinned: !c.pinned, updatedAt: Date.now() } : c)
        })),

      toggleStar: id =>
        set(s => ({
          conversations: s.conversations.map(c =>
            c.id === id ? { ...c, starred: !c.starred } : c)
        })),

      setActive: id => set({ activeId: id }),

      ensureTitle: (id, firstMessage) => {
        const conv = get().conversations.find(c => c.id === id)
        if (!conv || conv.title !== NEW_TITLE) return
        const title = firstMessage.trim().replace(/\s+/g, ' ').slice(0, 48)
        if (!title) return
        get().rename(id, title)
      },

      touch: id =>
        set(s => ({
          conversations: s.conversations.map(c =>
            c.id === id ? { ...c, updatedAt: Date.now() } : c)
        }))
    }),
    { name: 'atlas-conversations', version: 1 }
  )
)

/* ─── ذخیرهٔ پیامها (جدا از متا) ─── */

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
        })
    }),
    { name: 'atlas-threads', version: 1 }
  )
)

/* ─── گروهبندی لیست (Pinned / Today / Previous 7 days / Older) ─── */

export type ConvGroup = 'pinned' | 'today' | 'week' | 'older'

export function groupConversations(convs: ConversationMeta[]): Array<{ group: ConvGroup; items: ConversationMeta[] }> {
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
  const todayMs = startOfDay.getTime()
  const weekMs = todayMs - 7 * 86_400_000

  const buckets: Record<ConvGroup, ConversationMeta[]> = { pinned: [], today: [], week: [], older: [] }
  for (const c of [...convs].sort((a, b) => b.updatedAt - a.updatedAt)) {
    if (c.pinned) buckets.pinned.push(c)
    else if (c.updatedAt >= todayMs) buckets.today.push(c)
    else if (c.updatedAt >= weekMs) buckets.week.push(c)
    else buckets.older.push(c)
  }

  const labels: Record<ConvGroup, string> = {
    pinned: '📌 سنجاقشده', today: 'امروز', week: '۷ روز اخیر', older: 'قدیمیتر'
  }
  return (Object.keys(buckets) as ConvGroup[])
    .filter(g => buckets[g].length > 0)
    .map(g => ({ group: g, items: buckets[g], label: labels[g] }) as { group: ConvGroup; items: ConversationMeta[]; label: string })
}
