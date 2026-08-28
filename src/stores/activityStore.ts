/**
 * Activity Store — فید زندهٔ فراخوانی ابزارهای عامل
 * از طریق IPC (atlas:activity) از پروسهٔ اصلی پر میشود و در پنل نمایش داده میگردد.
 */
import { create } from "zustand";
import type { AtlasActivity } from "@/types/atlas-api";

export interface ActivityEntry {
  id: string
  tool: string
  args?: Record<string, unknown>
  result?: unknown
  error?: string
  ts: number
  pending?: boolean
  screenshot?: string
}

interface ActivityState {
  entries: ActivityEntry[];
  lastScreenshot?: string;
  push: (e: ActivityEntry) => void;
  setLastScreenshot: (s: string) => void;
  clear: () => void;
}

let counter = 0;

/** حداکثر تعداد اسکرین‌شاتی که همزمان در حافظه نگه داشته میشود (جلوگیری از مصرف RAM) */
const MAX_SCREENSHOTS = 5;

export const useActivityStore = create<ActivityState>((set) => ({
  entries: [],
  lastScreenshot: undefined,
  push: (e) =>
    set((s) => {
      // اسکرین‌شاتها سنگیناند (base64)؛ فقط چندتای آخر نگه داشته میشوند
      const entries = [e, ...s.entries]
        .slice(0, 200)
        .map((en, i) => (i >= MAX_SCREENSHOTS && en.screenshot ? { ...en, screenshot: undefined } : en));
      return { entries };
    }),
  setLastScreenshot: (screenshot) => set({ lastScreenshot: screenshot }),
  clear: () => set({ entries: [] }),
}));

/** فرمت کردن یک رکورد فعالیت از پروسهٔ اصلی */
export function formatBackendActivity(data: AtlasActivity): ActivityEntry {
  return {
    id: `a${Date.now()}-${counter++}`,
    tool: data.tool,
    args: data.args,
    result: data.result,
    error: data.error,
    ts: data.ts,
    pending: data.pending,
  };
}
