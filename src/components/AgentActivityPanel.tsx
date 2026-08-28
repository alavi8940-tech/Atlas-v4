"use client";

import { useActivityStore, type ActivityEntry } from "@/stores/activityStore";
import {
  X,
  Terminal,
  Cpu,
  MousePointerClick,
  Keyboard,
  Camera,
  FolderOpen,
  FileText,
  Clipboard,
  Brain,
  Trash2,
  Activity,
  ScanText,
  Pencil,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type ComponentType, type CSSProperties } from "react";
import { useAui } from "@assistant-ui/react";
import { ImageStudio } from "@/components/ImageStudio";

const ICONS: Record<string, ComponentType<{ size?: number; className?: string; style?: CSSProperties }>> = {
  shell_exec: Terminal,
  system_info: Cpu,
  mouse_move: MousePointerClick,
  mouse_click: MousePointerClick,
  mouse_scroll: MousePointerClick,
  keyboard_type: Keyboard,
  keyboard_press: Keyboard,
  screen_capture: Camera,
  fs_list: FolderOpen,
  fs_read: FileText,
  fs_write: FileText,
  fs_mkdir: FolderOpen,
  fs_exists: FileText,
  clipboard_read: Clipboard,
  clipboard_write: Clipboard,
  memory_set: Brain,
  memory_get: Brain,
  memory_list: Brain,
  memory_delete: Trash2,
  proc_list: Cpu,
  proc_kill: Cpu,
};

function toolLabel(tool: string): string {
  const map: Record<string, string> = {
    shell_exec: "اجرای شل",
    system_info: "اطلاعات سیستم",
    mouse_move: "جابجایی موس",
    mouse_click: "کلیک موس",
    mouse_scroll: "اسکرول",
    keyboard_type: "تایپ کیبورد",
    keyboard_press: "فشار کلید",
    screen_capture: "اسکرین‌شات",
    fs_list: "فهرست پوشه",
    fs_read: "خواندن فایل",
    fs_write: "نوشتن فایل",
    fs_mkdir: "ساخت پوشه",
    fs_exists: "بررسی مسیر",
    clipboard_read: "خواندن کلیپبورد",
    clipboard_write: "نوشتن کلیپبورد",
    memory_set: "ذخیرهٔ حافظه",
    memory_get: "بازیابی حافظه",
    memory_list: "فهرست حافظه",
    memory_delete: "حذف حافظه",
    proc_list: "فهرست فرآیندها",
    proc_kill: "توقف فرآیند",
  };
  return map[tool] ?? tool;
}

function summarize(e: ActivityEntry): string {
  if (e.error) return `خطا: ${e.error}`;
  const a = e.args as Record<string, unknown> | undefined;
  if (a) {
    const parts = Object.entries(a)
      .filter(([, v]) => v !== undefined && v !== "" && v !== false)
      .map(([k, v]) => `${k}=${typeof v === "string" && v.length > 60 ? v.slice(0, 60) + "…" : String(v)}`);
    if (parts.length) return parts.join("  ·  ");
  }
  if (e.result && typeof e.result === "object") {
    const r = e.result as Record<string, unknown>;
    if (r.ok !== undefined) return r.ok ? "انجام شد" : "ناموفق";
    return JSON.stringify(r).slice(0, 80);
  }
  return "انجام شد";
}

export function AgentActivityPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const entries = useActivityStore((s) => s.entries);
  const clear = useActivityStore((s) => s.clear);
  const aui = useAui();
  const [editSrc, setEditSrc] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="glass absolute inset-y-0 left-0 z-40 flex w-[340px] max-w-[86vw] flex-col rounded-none border-l"
          style={{ borderColor: "var(--glass-border)" }}
        >
          <header className="flex items-center gap-2 border-b p-3" style={{ borderColor: "var(--glass-border)" }}>
            <Activity size={16} style={{ color: "var(--accent)" }} />
            <span className="font-medium">فعالیت عامل</span>
            <span className="text-xs text-[var(--text-secondary)]">{entries.length} رویداد</span>
            <div className="ms-auto flex items-center gap-1">
              <button
                onClick={clear}
                className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--glass-hover)]"
                title="پاکسازی"
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--glass-hover)]"
                title="بستن"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {entries.length === 0 && (
              <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
                هنوز ابزاری اجرا نشده. حالت عامل را از تنظیمات روشن کنید.
              </p>
            )}
            {entries.map((e) => {
              const Icon = ICONS[e.tool] ?? Terminal;
              return (
                <div
                  key={e.id}
                  className="animate-in fade-in slide-in-from-left-2 rounded-xl border p-2.5 duration-300"
                  style={{ borderColor: "var(--glass-border)", background: "var(--glass-card)" }}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} style={{ color: "var(--accent)" }} />
                    <span className="text-sm font-medium">{toolLabel(e.tool)}</span>
                    <span className="ms-auto text-[10px] text-[var(--text-secondary)]">
                      {new Date(e.ts).toLocaleTimeString("fa-IR")}
                    </span>
                  </div>
                  <p className="mt-1 break-words text-xs text-[var(--text-secondary)]">{summarize(e)}</p>
                  {e.screenshot && (
                    <>
                      <img
                        src={e.screenshot}
                        alt="screenshot"
                        className="mt-2 max-h-40 w-full rounded-lg border object-cover"
                        style={{ borderColor: "var(--glass-border)" }}
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => aui.thread.append(`[تصویر پیوست]\n${e.screenshot}\n\nاین تصویر را توصیف و خلاصه کن.`)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] transition-colors hover:bg-[var(--glass-hover)]"
                          style={{ color: "var(--accent)" }}
                          title="خلاصهٔ تصویر در چت"
                        >
                          <ScanText size={12} /> خلاصه
                        </button>
                        <button
                          onClick={() => setEditSrc(e.screenshot ?? null)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] transition-colors hover:bg-[var(--glass-hover)]"
                          style={{ color: "var(--text-secondary)" }}
                          title="ویرایش تصویر (استودیو)"
                        >
                          <Pencil size={12} /> ویرایش
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </motion.aside>
      )}
      {editSrc && <ImageStudio src={editSrc} onClose={() => setEditSrc(null)} />}
    </AnimatePresence>
  );
}
