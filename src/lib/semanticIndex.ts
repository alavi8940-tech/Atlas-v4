/**
 * semanticIndex — ایندکس معنایی پایدار روی مکالمه‌ها.
 * بردار هر مکالمه را یک‌بار محاسبه و در localStorage نگه میدارد؛ جستجو
 * بدون نیاز به ایمبدینگِ مجددِ همهٔ مکالمه‌ها انجام میشود. در صورت تغییر
 * متن مکالمه، ایندکس به‌روزرسانی میگردد.
 */
import { embed, cosine } from "@/lib/embed"
import { loadJSON, saveJSON } from "@/lib/persist"

export interface IndexEntry {
  embedding: number[]
  hash: number
  updatedAt: number
}

/** هش ارزان برای تشخیص تغییر متن (جلوگیری از ایمبدینگِ تکراری) */
function hashText(t: string): number {
  let h = 0
  for (let i = 0; i < t.length; i++) h = (Math.imul(h, 31) + t.charCodeAt(i)) | 0
  return h
}

const KEY = "atlas-semantic-index"

type Index = Record<string, IndexEntry>

function readIndex(): Index {
  return loadJSON<Index>(KEY, {})
}

function writeIndex(i: Index): void {
  saveJSON(KEY, i)
}

/** به‌روزرسانی ایندکس برای یک مکالمه (در صورت تغییر متن) */
export async function indexConversation(id: string, text: string): Promise<void> {
  const idx = readIndex()
  const prev = idx[id]
  const norm = text.slice(0, 6000)
  const hash = hashText(norm)
  if (prev && prev.hash === hash) return
  idx[id] = { embedding: await embed(norm), hash, updatedAt: Date.now() }
  writeIndex(idx)
}

export function removeFromIndex(id: string): void {
  const idx = readIndex()
  if (id in idx) {
    delete idx[id]
    writeIndex(idx)
  }
}

export function clearIndex(): void {
  writeIndex({})
}

export interface SemanticRank {
  id: string
  score: number
}

/** رتبه‌بندی مکالمه‌ها بر اساس شباهت معنایی به پرسش */
export async function semanticQuery(query: string, topK = 8): Promise<SemanticRank[]> {
  const qe = await embed(query)
  const idx = readIndex()
  return Object.entries(idx)
    .map(([id, e]) => ({ id, score: cosine(qe, e.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}
