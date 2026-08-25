# 🧭 پرامپت احیای پروژه Atlas v4 — این متن را در گفتگوی جدید ارسال کن

من پروژهٔ **Atlas v4** را میسازم: یک دستیار هوشمند محلی (Local AI Agent) با رابط شیشه‌ای فارسی/RTL. گفتگوی قبلی قطع شد؛ این سند کامل وضعیت است. **قبل از هر کاری این را بخوان و هیچ چیز را از نو اکتشاف نکن.**

---

## ۱) مسیرها و زیرساخت

| مورد | مسیر |
|---|---|
| پروژه | `/home/mamadi/Projects/Atlas-v4` |
| آرسنال (کتابخانهها + تمپلیتها) | `/home/mamadi/arsenal` — `node_modules` با ~۸۲۸ پکیج، `templates/` با ۲۸ مخزن مرجع |
| گیت‌هاب (خصوصی) | `alavi8940-tech/Atlas-v4` — CI با GitHub Actions روی هر push اپimage میسازد |
| نصب روی سیستم | `/home/mamadi/Applications/Atlas.AppImage` |
| توکن skills.sh | در `.env.local` پروژه (`VITE_SKILLS_SH_TOKEN`) — ⚠️ این توکن `vcp_...` توسط skills.sh **رد میشود**؛ فقط `sk_live_...` یا JWT ویژهای Vercel (OIDC) قبول است |
| صدای نوتیفیکیشن | `scripts/atlas_chime.py` (پایتون خالص، ۵ ثانیه، `paplay`) |
| اسپینر فکر کردن | `src/assets/lottie/ai-spinner.json` — دو حلقهٔ چرخان دور لوگوی آبی (۴.۶MB، باید lazy-load شود) |

## ۲) وضعیت فعلی — چه چیزهایی کار میکند ✅

- **UI شیشه‌ای ۸ تم** با گوی Atlas، RTL فارسی کامل، انیمیشنها
- **چت واقعی و سالم**: `src/components/assistant-ui/thread.tsx` (کپی رسمی از `arsenal/templates/assistant-ui/templates/minimal/` — با API درست render-function + AuiIf). ارسال/استریم/توقف/تولیددوباره/کپی/مارکداون/جدول — همه تست شده، صفر استثنا
- **اتصال مدل واقعی**: `src/lib/atlasRuntime.ts` با `streamText` از `ai@7.0.79` + `@ai-sdk/openai@4.0.47` — Ollama محلی و API سازگار OpenAI
- **تنظیمات ماندگار** (`zustand/persist`): `src/stores/settingsStore.ts` + دیالوگ `SettingsDialog.tsx` با تست اتصال زنده
- **مدیریت مکالمه**: `src/stores/conversationsStore.ts` — ساخت/حذف/پین/ستاره/تغییرنام/عنوان خودکار/گروهبندی Pinned/Today/7days/Older + ذخیرهٔ thread با `export()/import()` ران‌تایم
- **فروشگاه مهارتها**: `src/components/SkillsStorePanel.tsx` + `src/lib/skillsApi.ts` + `src/stores/skillsStore.ts` — متصل به skills.sh (با فالبک گیتهاب که کار میکند)، نصب ماندگار، فعال/غیرفعال در سطح مکالمه، نمایش SKILL.md و ممیزی امنیتی
- **پرامپت پایهٔ قفل**: `src/lib/corePrompt.ts` — نامرئی برای کاربر، همیشه تزریق میشود + معرفی سازنده (alavi8940-tech)
- **دسکتاپ**: `desktop/main.cjs` (الکترون، بدون منو، لینک خارجی → مرورگر) + `electron-builder.yml` + CI در `.github/workflows/build.yml`

## ۳) درسهای سخت (اینها را دوباره تکرار نکن!)

1. **vite**: `base: './'` الزامی برای `file://` الکترون — وگرنه صفحهٔ سفید
2. **main.cjs**: بیلد در ریشه است → `path.join(__dirname, '..', 'dist', 'index.html')`
3. **TypeScript 6**: `baseUrl` منسوخ — فقط `paths` با `"moduleResolution": "bundler"`
4. **assistant-ui 0.15.16**: API قدیمی `components={{UserMessage}}` در `ThreadPrimitive.Messages` کرش میکند (`scope has no message property`) — فقط فرم render-function یا تمپلیت رسمی آرسنال
5. **electron-builder**: نسخهٔ `25.1.8` پین شده (نسخهٔ ۲۶ گزینهٔ `linux.desktop` را حذف کرده) + `electron@33.4.11` پین شده
6. **npm محلی**: `allow-remote=none` است → برای بازتولید lockfile: `npm install --package-lock-only --allow-remote=all --registry=https://registry.npmjs.org`
7. **تست بدون مرورگر ابزاری**: با CDP از کروم سیستم (`/opt/google/chrome/chrome --headless=new --remote-debugging-port=...`) — target را از `/json/list` با `type==='page'` بگیر
8. **skills.sh**: endpointهای `/api/v1/skills*` احراز هویت میخواهند؛ فالبک گیتهاب (raw.githubusercontent + api.github.com/contents) بدون توکن کار میکند

## ۴) خواستههای من برای فاز بعد (به ترتیب اولویت)

### الف) تنظیمات مدل — بازطراحی بزرگ
1. **حذف کامل**: دما، حداکثر توکن، تایپ دستی نام مدل، و **حالت نمایش (demo) کلاً حذف شود**
2. **فچ مدلها از API**: با `/v1/models` هر endpoint (OpenAI-compatible و Ollama) لیست مدلها گرفته شود و در dropdown بیاید
3. **پروتکل Anthropic اضافه شود** (کنار OpenAI-compatible و Ollama) — از `@ai-sdk/anthropic` آرسنال
4. **تشخیص خودکار نوع مدل** (چت/استدلالی/تصویر/صدا/ویدئو) از نام و متادیتا
5. پرامپت سیستم کاربر بماند؛ پرامپت پایهٔ قفل دستنخورده

### ب) رندر اختصاصی هر نوع خروجی — از آماده استفاده کن، دستنویس نه!
از **AI Elements** (`elements.ai-sdk.dev` — رجیستری shadcn مخصوص AI SDK، نصب با `npx shadcn add`) و آرسنال:
- Reasoning (بلوک فکر مدل) / Sources / MessageBranch / PromptInput با ابزارها / Attachments سهحالته / Conversation + scroll
- **تصویر**: lightbox آرسنال (`yet-another-react-lightbox`)
- **صوت**: `wavesurfer.js` آرسنال
- **ویدئو**: `vidstack` آرسنال
- **اسپینر فکر**: از `src/assets/lottie/ai-spinner.json` با `lottie-react` (lazy import — فایل ۴.۶MB است)
- کامپوننتها باید با تم شیشه‌ای Atlas (متغیرهای `--accent`, `--glass-*` در `index.css`) هماهنگ شوند

### ج) جایگزینی 🧭 در Welcome
به جای ایموجی، یک **پرامپت آمادهٔ تولید تصویر** بگذار (کارت/دکمهٔ «🎨 ساخت تصویر» که پرامپت تصویرسازی بگیرد) — مدل تصویرساز از تنظیمات.

### د) بک‌اند واقعی (فاز بعد از این)
Electron IPC + `better-sqlite3` آرسنال: ابزارهای fs/shell/screen/proc/clip/memory + حلقهٔ عامل با حداکثر ۱۲ تکرار + گزارش فعالیت. پرامپت قفل (`corePrompt.ts`) باید این ابزارها را معرفی کند.

## ۵) قوانین همیشگی

- **از آرسنال و AI Elements کپی کن، دستی ننویس** — هزینه و باگ کمتر
- هر تغییر: `npm run build` سبز → تست CDP → کامیت → push → CI اپimage میسازد → دانلود artifact → جایگزینی `/home/mamadi/Applications/Atlas.AppImage`
- کامیتها فارسی/انگلیسی فرقی ندارد ولی توضیح ریشهٔ باگ را بنویس
- سازندهٔ برنامه من هستم: **alavi8940-tech** — این در پرامپت قفل هست
- توکنهای حساس فقط در `.env.local` (gitignore شده)

## ۶) شروع کار

اول `git log --oneline -5` و `npm run build` را اجرا کن تا از سلامت مطمئن شوی، بعد بگو چه چیزی از بخش ۴ شروع میکنی و منتظر تأیید من بمان — مگر اینکه گفته باشم «برو». صدای پایان کار: `python3 scripts/atlas_chime.py`

**حالا شروع کن. 🧭**
