/**
 * embed — تولید بردارِ معنایی برای یک متن.
 * اگر Ollama با یک مدل embed (مثل nomic-embed-text) در دسترس باشد از آن استفاده میشود؛
 * در غیر این صورت یک بردار هش‌شدهٔ محلی (offline) برمی‌گرداند تا جستجوی معنایی
 * بدون مدل هم کار کند (دقت پایین‌تر ولی قطعاً آفلاین).
 */
import { proxyFetch } from "@/lib/modelCatalog"
import { getModelSettings, useSettingsStore } from "@/stores/settingsStore"

export const LOCAL_EMBED_DIM = 256

/** بردار محلیِ قطعی بر اساس کیسه‌واژه‌های هش‌شده (بدون مدل) */
function localEmbed(text: string): number[] {
  const v = new Array<number>(LOCAL_EMBED_DIM).fill(0)
  const tokens = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean)
  for (const tok of tokens) {
    let h = 2166136261
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    // دو برکت ساده برای کاهش برخورد
    const i1 = (h >>> 0) % LOCAL_EMBED_DIM
    const i2 = ((h >>> 13) ^ 0x9e3779b9) % LOCAL_EMBED_DIM
    v[i1] += 1
    v[i2] += 0.5
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1
  return v.map((x) => x / norm)
}

export async function embed(text: string): Promise<number[]> {
  const s = getModelSettings()
  if (s.provider === "ollama") {
    const base = s.ollamaBaseURL.replace(/\/v1$/, "")
    const model = useSettingsStore.getState().embeddingModel || s.ollamaModel || "nomic-embed-text"
    try {
      const res = await proxyFetch(`${base}/api/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt: text.slice(0, 8000) }),
      })
      const j = (await res.json()) as { embedding?: number[] }
      if (Array.isArray(j.embedding) && j.embedding.length > 0) return j.embedding
    } catch (e) {
      console.warn("embed: Ollama در دسترس نیست، بردار محلی استفاده میشود", e)
    }
  }
  return localEmbed(text)
}

/** شباهت کسینوسی (آرایه‌های هم‌اندازه یا با پدینگ) */
export function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1)
}
