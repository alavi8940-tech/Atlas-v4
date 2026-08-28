/**
 * sync — موتور همگام‌سازی Atlas.
 * آداپتور «محلی»: خروجی/ورودی پشتیبان (export/import).
 * آداپتور «ریموت»: push/pull به یک نقطهٔ پایانی سازگار با REST (مثل سرور شخصی،
 * صندوقچه رمزنگذاری‌شده، یا سرویس WebDAV) از طریق proxyFetch. ادغام آخرین
 * نوشته (last-write-wins) روی کلیدهای اصلی اعمال میشود.
 * نیاز به تنظیمات: syncMode / syncEndpoint / syncToken (در settingsStore).
 */
import { proxyFetch } from "@/lib/modelCatalog"
import { loadJSON, saveJSON } from "@/lib/persist"

export interface SyncSnapshot {
  version: number
  updatedAt: number
  data: Record<string, unknown>
}

export interface SyncStatus {
  ok: boolean
  mode: "local" | "remote" | "off"
  message: string
  at: number
}

export function collectSnapshot(): SyncSnapshot {
  return {
    version: 2,
    updatedAt: Date.now(),
    data: {
      settings: loadJSON("atlas-settings", null),
      conversations: loadJSON("atlas-conversations", null),
      threads: loadJSON("atlas-threads", null),
      macros: loadJSON("atlas-macros", null),
      schedule: loadJSON("atlas-schedule", null),
      skills: loadJSON("atlas-skills", null),
      rag: loadJSON("atlas-rag", null),
      semanticIndex: loadJSON("atlas-semantic-index", null),
    },
  }
}

/** اعمال یک نمونه روی حالت محلی (با ادغام سطح‌کلید) */
export function applySnapshot(snap: SyncSnapshot): SyncStatus {
  try {
    const map: Record<string, string> = {
      settings: "atlas-settings",
      conversations: "atlas-conversations",
      threads: "atlas-threads",
      macros: "atlas-macros",
      schedule: "atlas-schedule",
      skills: "atlas-skills",
      rag: "atlas-rag",
      semanticIndex: "atlas-semantic-index",
    }
    for (const [k, storageKey] of Object.entries(map)) {
      if (snap.data[k] != null) saveJSON(storageKey, snap.data[k])
    }
    return { ok: true, mode: "local", message: "بازیابی انجام شد ✓", at: Date.now() }
  } catch (e) {
    return { ok: false, mode: "local", message: `خطا: ${e instanceof Error ? e.message : String(e)}`, at: Date.now() }
  }
}

/** ادغام دو نمونه (آخرین نوشته برنده میشود) */
export function mergeSnapshots(local: SyncSnapshot, remote: SyncSnapshot): SyncSnapshot {
  const data: Record<string, unknown> = { ...remote.data }
  for (const [k, v] of Object.entries(local.data)) {
    // اگر ریموت قدیمی‌تر است (updatedAt کمتر)، نسخهٔ محلی را نگه میداریم
    const localNewer = local.updatedAt >= remote.updatedAt
    if (localNewer) data[k] = v
  }
  return { version: 2, updatedAt: Math.max(local.updatedAt, remote.updatedAt), data }
}

async function remotePut(endpoint: string, token: string, snap: SyncSnapshot): Promise<SyncStatus> {
  try {
    const res = await proxyFetch(endpoint.replace(/\/+$/, ""), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(snap),
    })
    if (!res.ok) return { ok: false, mode: "remote", message: `HTTP ${res.status}`, at: Date.now() }
    return { ok: true, mode: "remote", message: "بارگذاری شد ✓", at: Date.now() }
  } catch (e) {
    return { ok: false, mode: "remote", message: e instanceof Error ? e.message : String(e), at: Date.now() }
  }
}

async function remoteGet(endpoint: string, token: string): Promise<SyncSnapshot | null> {
  try {
    const res = await proxyFetch(endpoint.replace(/\/+$/, ""), {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) return null
    return (await res.json()) as SyncSnapshot
  } catch {
    return null
  }
}

export interface RemoteConfig {
  endpoint: string
  token: string
}

/** push به ریموت (با ادغام هوشمند در صورت وجود نمونهٔ قبلی) */
export async function syncPush(cfg: RemoteConfig): Promise<SyncStatus> {
  if (!cfg.endpoint.trim()) return { ok: false, mode: "remote", message: "نقطهٔ پایانی تنظیم نشده", at: Date.now() }
  const local = collectSnapshot()
  const remote = await remoteGet(cfg.endpoint, cfg.token)
  const toPush = remote ? mergeSnapshots(local, remote) : local
  return remotePut(cfg.endpoint, cfg.token, toPush)
}

export async function syncPull(cfg: RemoteConfig): Promise<SyncStatus> {
  if (!cfg.endpoint.trim()) return { ok: false, mode: "remote", message: "نقطهٔ پایانی تنظیم نشده", at: Date.now() }
  const remote = await remoteGet(cfg.endpoint, cfg.token)
  if (!remote) return { ok: false, mode: "remote", message: "دریافت ناموفق", at: Date.now() }
  return applySnapshot(remote)
}
