/** هلپر پایداری روی localStorage (JSON) با فال‌بک حافظه برای محیطهای بدون localStorage (SSR/تست/node) */
const memory = new Map<string, string>()

function storage(): Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  try {
    if (typeof localStorage !== "undefined") return localStorage
  } catch {
    /* دسترسی به localStorage ممکن است پرتاب کند */
  }
  return {
    getItem: (k: string) => (memory.has(k) ? memory.get(k)! : null),
    setItem: (k: string, v: string) => void memory.set(k, v),
    removeItem: (k: string) => void memory.delete(k),
  }
}

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = storage().getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    storage().setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn(`persist: نوشتن ${key} شکست`, e)
  }
}

export function removeKey(key: string): void {
  try {
    storage().removeItem(key)
  } catch {
    /* ignore */
  }
}
