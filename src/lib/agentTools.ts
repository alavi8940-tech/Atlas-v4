/**
 * Atlas Agent Tools — ابزارهای عامل برای دسترسی به سیستم
 * هر ابزار روی پروسهٔ اصلی (Electron) اجرا میشود و از طریق IPC فراخوانی میگردد.
 * در حالت مرورگر (بدون electron) با پیام ملایمی باز میگردد.
 */
import { jsonSchema, type ToolSet, type Tool } from "ai";
import { useActivityStore } from "@/stores/activityStore";

type RawResult = {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
};

type Api = {
  invokeTool?: (t: string, a: Record<string, unknown>) => Promise<RawResult>;
  captureScreen?: () => Promise<string>;
  onActivity?: (cb: (d: unknown) => void) => () => void;
};

function getApi(): Api | undefined {
  return (window as unknown as { atlasAPI?: Api }).atlasAPI;
}

/** فراخوانی ابزار در پروسهٔ اصلی از طریق preload */
async function invoke(toolName: string, args: Record<string, unknown>): Promise<RawResult> {
  const api = getApi();
  if (!api?.invokeTool) {
    return { ok: false, error: "ابزارهای سیستمی فقط در نسخهٔ دسکتاپ (Electron) در دسترسند." };
  }
  return api.invokeTool(toolName, args);
}

/** فشرده‌سازی خروجی برای ارسال به مدل */
function compact(res: RawResult): string {
  if (!res.ok) return `خطا: ${res.error ?? "نامشخص"}`;
  const clone: Record<string, unknown> = { ...res };
  delete clone.ok;
  for (const k of ["stdout", "stderr", "content", "entries", "processes"]) {
    if (typeof clone[k] === "string" && (clone[k] as string).length > 8000) {
      clone[k] = (clone[k] as string).slice(0, 8000) + "\n… (بریده‌شده)";
    }
  }
  if (Object.keys(clone).length === 0) return "انجام شد.";
  return JSON.stringify(clone, null, 2);
}

function str(v: unknown, d = ""): string {
  return typeof v === "string" ? v : d;
}
function num(v: unknown, d = 0): number {
  return typeof v === "number" ? v : d;
}

/** هلپر ساخت ابزار با بستن ایمن تایپ‌ها */
function atlasTool<Args extends Record<string, unknown>>(config: {
  description: string;
  schema: Record<string, unknown>;
  execute: (args: Args) => Promise<unknown> | unknown;
}): Tool {
  return {
    description: config.description,
    parameters: jsonSchema(config.schema as never),
    execute: config.execute as never,
  } as unknown as Tool;
}

export function buildAgentTools(): ToolSet {
  return {
    system_info: atlasTool({
      description: "دریافت اطلاعات کلی سیستم (سیستم‌عامل، معماری، تعداد هسته، حافظه، نمایشگرها).",
      schema: { type: "object", properties: {} },
      execute: async () => compact(await invoke("system_info", {})),
    }),

    shell_exec: atlasTool({
      description:
        "اجرای یک دستور ترمینال/شل روی سیستم کاربر و بازگرداندن خروجی (stdout/stderr/کد خروج). برای نصب، اجرا، جستجو و مدیریت سیستم استفاده شود.",
      schema: {
        type: "object",
        properties: {
          command: { type: "string", description: "دستور شل کامل، مثلاً 'ls -la' یا 'npm run build'" },
          cwd: { type: "string", description: "مسیر پوشهٔ اجرا (اختیاری)" },
          timeoutMs: { type: "number", description: "محدودیت زمان به میلی‌ثانیه (پیش‌فرض ۳۰۰۰۰)" },
        },
        required: ["command"],
      },
      execute: async (a) =>
        compact(await invoke("shell_exec", { command: str(a.command), cwd: str(a.cwd), timeoutMs: num(a.timeoutMs) })),
    }),

    fs_list: atlasTool({
      description: "فهرست کردن محتوای یک پوشه.",
      schema: { type: "object", properties: { path: { type: "string", description: "مسیر پوشه (پیش‌فرض خانهٔ کاربر)" } } },
      execute: async (a) => compact(await invoke("fs_list", { path: str(a.path) })),
    }),

    fs_read: atlasTool({
      description: "خواندن محتوای یک فایل متنی.",
      schema: {
        type: "object",
        properties: {
          path: { type: "string", description: "مسیر کامل فایل" },
          limit: { type: "number", description: "محدودیت تعداد کاراکتر (اختیاری)" },
        },
        required: ["path"],
      },
      execute: async (a) => compact(await invoke("fs_read", { path: str(a.path), limit: num(a.limit) })),
    }),

    fs_write: atlasTool({
      description: "نوشتن یا الحاق محتوا به یک فایل (پوشه‌ها ساخته میشوند).",
      schema: {
        type: "object",
        properties: {
          path: { type: "string", description: "مسیر کامل فایل" },
          content: { type: "string", description: "محتوای نوشتنی" },
          append: { type: "boolean", description: "الحاق به انتهای فایل به‌جای جایگزینی" },
        },
        required: ["path", "content"],
      },
      execute: async (a) =>
        compact(await invoke("fs_write", { path: str(a.path), content: str(a.content), append: a.append === true })),
    }),

    fs_mkdir: atlasTool({
      description: "ساخت یک پوشه (با زیرپوشه‌ها).",
      schema: { type: "object", properties: { path: { type: "string", description: "مسیر پوشه" } }, required: ["path"] },
      execute: async (a) => compact(await invoke("fs_mkdir", { path: str(a.path) })),
    }),

    fs_exists: atlasTool({
      description: "بررسی وجود یک فایل یا پوشه.",
      schema: { type: "object", properties: { path: { type: "string", description: "مسیر" } }, required: ["path"] },
      execute: async (a) => compact(await invoke("fs_exists", { path: str(a.path) })),
    }),

    proc_list: atlasTool({
      description: "فهرست فرآیندهای در حال اجرا به ترتیب مصرف CPU.",
      schema: { type: "object", properties: {} },
      execute: async () => compact(await invoke("proc_list", {})),
    }),

    proc_kill: atlasTool({
      description: "متوقف کردن یک فرآیند با شناسه (PID).",
      schema: {
        type: "object",
        properties: {
          pid: { type: "number", description: "شناسهٔ فرآیند" },
          signal: { type: "string", description: "سیگنال (پیش‌فرض SIGTERM)" },
        },
        required: ["pid"],
      },
      execute: async (a) => compact(await invoke("proc_kill", { pid: num(a.pid), signal: str(a.signal, "SIGTERM") })),
    }),

    clipboard_read: atlasTool({
      description: "خواندن متن کلیپبورد سیستم.",
      schema: { type: "object", properties: {} },
      execute: async () => compact(await invoke("clipboard_read", {})),
    }),

    clipboard_write: atlasTool({
      description: "نوشتن متن در کلیپبورد سیستم.",
      schema: {
        type: "object",
        properties: { text: { type: "string", description: "متن برای کپی" } },
        required: ["text"],
      },
      execute: async (a) => compact(await invoke("clipboard_write", { text: str(a.text) })),
    }),

    mouse_move: atlasTool({
      description: "جابجا کردن موس به مختصات صفحهٔ نمایش (x, y).",
      schema: {
        type: "object",
        properties: {
          x: { type: "number", description: "مختصات افقی پیکسل" },
          y: { type: "number", description: "مختصات عمودی پیکسل" },
        },
        required: ["x", "y"],
      },
      execute: async (a) => compact(await invoke("mouse_move", { x: num(a.x), y: num(a.y) })),
    }),

    mouse_click: atlasTool({
      description: "کلیک موس (چپ/راست/میانه)، اختیاری در مختصات مشخص.",
      schema: {
        type: "object",
        properties: {
          button: { type: "string", enum: ["left", "right", "middle"], description: "دکمه (پیش‌فرض left)" },
          x: { type: "number", description: "مختصات x (اختیاری)" },
          y: { type: "number", description: "مختصات y (اختیاری)" },
          count: { type: "number", description: "تعداد کلیک (پیش‌فرض ۱)" },
        },
      },
      execute: async (a) =>
        compact(await invoke("mouse_click", { button: str(a.button, "left"), x: num(a.x), y: num(a.y), count: num(a.count, 1) })),
    }),

    mouse_scroll: atlasTool({
      description: "اسکرول صفحه (dy مثبت به پایین، منفی به بالا).",
      schema: {
        type: "object",
        properties: {
          dx: { type: "number", description: "اسکرول افقی (معمولاً ۰)" },
          dy: { type: "number", description: "اسکرول عمودی" },
        },
      },
      execute: async (a) => compact(await invoke("mouse_scroll", { dx: num(a.dx), dy: num(a.dy) })),
    }),

    keyboard_type: atlasTool({
      description: "تایپ متن در جایی که موس قرار دارد.",
      schema: {
        type: "object",
        properties: { text: { type: "string", description: "متن برای تایپ" } },
        required: ["text"],
      },
      execute: async (a) => compact(await invoke("keyboard_type", { text: str(a.text) })),
    }),

    keyboard_press: atlasTool({
      description: "فشار دادن یک کلید (مثل Return، ctrl+c، alt+F4).",
      schema: {
        type: "object",
        properties: { key: { type: "string", description: "نام کلید طبق xdotool/سینتکس سیستم" } },
        required: ["key"],
      },
      execute: async (a) => compact(await invoke("keyboard_press", { key: str(a.key) })),
    }),

    memory_set: atlasTool({
      description: "ذخیرهٔ یک حقیقت در حافظهٔ بلندمدت Atlas (مثل اولویت‌ها، نام کاربر، جلسات).",
      schema: {
        type: "object",
        properties: {
          key: { type: "string", description: "کلید یکتا" },
          value: { type: "string", description: "مقدار برای ذخیره" },
        },
        required: ["key", "value"],
      },
      execute: async (a) => compact(await invoke("memory_set", { key: str(a.key), value: str(a.value) })),
    }),

    memory_get: atlasTool({
      description: "بازیابی یک مقدار از حافظهٔ بلندمدت.",
      schema: { type: "object", properties: { key: { type: "string", description: "کلید" } }, required: ["key"] },
      execute: async (a) => compact(await invoke("memory_get", { key: str(a.key) })),
    }),

    memory_list: atlasTool({
      description: "فهرست کلیدهای موجود در حافظهٔ بلندمدت.",
      schema: { type: "object", properties: {} },
      execute: async () => compact(await invoke("memory_list", {})),
    }),

    memory_delete: atlasTool({
      description: "حذف یک کلید از حافظهٔ بلندمدت.",
      schema: { type: "object", properties: { key: { type: "string", description: "کلید" } }, required: ["key"] },
      execute: async (a) => compact(await invoke("memory_delete", { key: str(a.key) })),
    }),

    screen_capture: atlasTool({
      description:
        "گرفتن اسکرین‌شات از صفحهٔ کاربر. خروجی در پنل فعالیت نمایش داده میشود تا وضعیت بصری سیستم دیده شود.",
      schema: { type: "object", properties: {} },
      execute: async () => {
        const api = getApi();
        if (!api?.captureScreen) return { ok: false, error: "اسکرین‌شات فقط در نسخهٔ دسکتاپ در دسترس است." };
        try {
          const dataUrl = await api.captureScreen();
          useActivityStore.getState().setLastScreenshot(dataUrl);
          useActivityStore.getState().push({
            id: `screen-${Date.now()}`,
            tool: "screen_capture",
            ts: Date.now(),
            screenshot: dataUrl,
          });
          return { ok: true, captured: true, bytes: dataUrl.length, note: "اسکرین‌شات با موفقیت گرفته شد و در پنل فعالیت نمایش داده شد." };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : String(e) };
        }
      },
    }),
  };
}
