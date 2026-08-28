/**
 * انواع سراسری برای پل Electron (preload → renderer)
 * تعریف تایپ‌دار window.atlasAPI تا نیازی به cast های پراکنده نباشد.
 */

export interface AtlasActivity {
  tool: string
  args?: Record<string, unknown>
  result?: unknown
  error?: string
  ts: number
  pending?: boolean
}

export interface ProxyOptions {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: string
}

export interface ProxyResult {
  ok: boolean
  status?: number
  body?: string
  error?: string
}

export interface AtlasAPI {
  platform: string
  invokeTool: (tool: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>
  captureScreen: () => Promise<string>
  openExternal: (url: string) => void
  /** تنظیم نیازبه‌تأیید دستورات خطرناک (شل/کشتن فرآیند/موس/کیبورد) */
  setConfirm?: (enabled: boolean) => void
  /** تنظیم حالت پلن (در انتظار تأیید ماندن دستورات خطرناک) */
  setPlan?: (enabled: boolean) => void
  /** پروکسی درخواستهای شبکه از پروسهٔ اصلی (کلیدها از مرورگر خارج نمیشوند) */
  proxy?: (opts: ProxyOptions) => Promise<ProxyResult>
  onActivity: (cb: (d: AtlasActivity) => void) => () => void
}

declare global {
  interface Window {
    atlasAPI?: AtlasAPI
  }
}

export {}
