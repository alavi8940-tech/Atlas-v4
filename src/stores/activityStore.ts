/**
 * Activity Store — فید زندهٔ فراخوانی ابزارهای عامل
 * از طریق IPC (atlas:activity) از پروسهٔ اصلی پر میشود و در پنل نمایش داده میگردد.
 */
import { create } from "zustand";

export interface ActivityEntry {
  id: string;
  tool: string;
  args?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  ts: number;
  screenshot?: string;
}

interface ActivityState {
  entries: ActivityEntry[];
  lastScreenshot?: string;
  push: (e: ActivityEntry) => void;
  setLastScreenshot: (s: string) => void;
  clear: () => void;
}

let counter = 0;

export const useActivityStore = create<ActivityState>((set) => ({
  entries: [],
  lastScreenshot: undefined,
  push: (e) =>
    set((s) => ({ entries: [e, ...s.entries].slice(0, 200) })),
  setLastScreenshot: (screenshot) => set({ lastScreenshot: screenshot }),
  clear: () => set({ entries: [] }),
}));

/** فرمت کردن یک رکورد فعالیت از پروسهٔ اصلی */
export function formatBackendActivity(data: {
  tool: string;
  args?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  ts: number;
}): ActivityEntry {
  return {
    id: `a${Date.now()}-${counter++}`,
    tool: data.tool,
    args: data.args,
    result: data.result,
    error: data.error,
    ts: data.ts,
  };
}
