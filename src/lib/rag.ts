/**
 * rag — موتور بازیابی مبتنی بر بردار (RAG) با ایندکس پایدار محلی.
 * اسناد را به تکه‌های کوچک میشکند، هر تکه را ایمبد میکند و در localStorage نگه
 * میدارد؛ جستجو نزدیک‌ترین تکه‌ها را برمی‌گرداند تا به چت ارسال شوند.
 */
import { embed, cosine } from "@/lib/embed"
import { loadJSON, saveJSON } from "@/lib/persist"

export interface RagChunk {
  id: string
  text: string
  embedding: number[]
}

export interface RagDoc {
  id: string
  name: string
  createdAt: number
  chunks: RagChunk[]
}

const KEY = "atlas-rag"

function readAll(): RagDoc[] {
  return loadJSON<RagDoc[]>(KEY, [])
}

function writeAll(docs: RagDoc[]): void {
  saveJSON(KEY, docs.slice(-50)) // محدودسازی حجم
}

/** تقسیم متن به تکه‌ها با همپوشانی (پاراگرافها و پاراگرافهای طولانی خرد میشوند) */
export function chunkText(text: string, size = 800, overlap = 80): string[] {
  const clean = text.replace(/\r/g, "").trim()
  if (!clean) return []
  const paras = clean.split(/\n{2,}/).filter(Boolean)
  const out: string[] = []
  let buf = ""
  const flush = () => {
    if (buf.trim()) out.push(buf.trim())
    buf = ""
  }
  const splitLong = (p: string) => {
    if (p.length <= size) return [p]
    const words = p.split(/\s+/)
    const parts: string[] = []
    let cur = ""
    for (const w of words) {
      if ((cur + " " + w).length > size && cur) {
        parts.push(cur)
        cur = w
      } else {
        cur = cur ? cur + " " + w : w
      }
    }
    if (cur) parts.push(cur)
    return parts
  }
  for (const p of paras) {
    for (const piece of splitLong(p)) {
      if (buf.length + piece.length > size) {
        flush()
        const tail = buf.split(/\s+/).slice(-Math.floor(overlap / 6)).join(" ")
        buf = tail ? tail + "\n" : ""
      }
      buf += (buf ? "\n" : "") + piece
    }
  }
  flush()
  return out
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export async function ragAddDocument(name: string, text: string): Promise<RagDoc> {
  const chunksRaw = chunkText(text)
  const chunks: RagChunk[] = []
  for (const c of chunksRaw.slice(0, 60)) {
    chunks.push({ id: uid(), text: c, embedding: await embed(c) })
  }
  const doc: RagDoc = { id: uid(), name, createdAt: Date.now(), chunks }
  const all = readAll()
  all.push(doc)
  writeAll(all)
  return doc
}

export function ragList(): RagDoc[] {
  return readAll()
}

export function ragRemove(id: string): void {
  writeAll(readAll().filter((d) => d.id !== id))
}

export function ragClear(): void {
  writeAll([])
}

export interface RagHit {
  doc: string
  chunk: string
  score: number
}

/** جستجوی معنایی در تکه‌های همهٔ اسناد */
export async function ragQuery(query: string, topK = 4): Promise<RagHit[]> {
  const qe = await embed(query)
  const all = readAll()
  const hits: RagHit[] = []
  for (const d of all) {
    for (const c of d.chunks) {
      hits.push({ doc: d.name, chunk: c.text, score: cosine(qe, c.embedding) })
    }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, topK)
}

/** فرمت‌بندی نتایج برای الحاق به چت */
export function formatRagContext(hits: RagHit[]): string {
  if (hits.length === 0) return ""
  const blocks = hits
    .map((h, i) => `【منبع ${i + 1}: ${h.doc} | نمره ${h.score.toFixed(2)}】\n${h.chunk}`)
    .join("\n\n")
  return `[مدارک بازیابی‌شده از RAG محلی]\n${blocks}`
}
