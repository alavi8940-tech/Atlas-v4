/**
 * Atlas Runtime — پل بین assistant-ui و موتور عامل
 * فاز ۱: استریم واقعی با AI SDK (آرسنال) — Ollama محلی / سرویس سازگار با OpenAI
 * حالت نمایش بهعنوان جایگزین وقتی مدلی تنظیم نشده باشد.
 */
import {
  type AssistantRuntime,
  type ChatModelAdapter,
  useLocalRuntime,
} from '@assistant-ui/react'
import { streamText, type LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { getModelSettings } from '@/stores/settingsStore'
import { buildSystemPrompt, CREATOR_INTRO, CREATOR } from '@/lib/corePrompt'

const SIMULATION_DELAY = 28

const DEMO_RESPONSES = [
  'سلام! من **Atlas** هستم — دستیار هوشمند محلی تو. 🧭\n\nالان در **حالت نمایش** هستم. برای وصل شدن به مدل واقعی، از **تنظیمات ⚙️** پروایدر را انتخاب کن (Ollama یا API سازگار با OpenAI).\n\nدر این حالت میتونم:\n\n- 📁 با فایلهای سیستمت کار کنم\n- 💻 دستور ترمینال اجرا کنم\n- 🎨 تصویر بسازم\n- 🧊 مدل سهبعدی نشونت بدم\n\nیکی رو امتحان کن!',
  'سوال خوبیه! بذار برات توضیح بدم:\n\n`Atlas` یک عامل محلی (local agent) هست که **هیچ دادهای از دستگاهت خارج نمیشه** — همهچیز همینجا میمونه.\n\n```python\n# مثال: اسکریپت بکاپی که Atlas میتونه بنویسه\nimport shutil\nshutil.make_archive("backup", "zip", "Documents")\n```\n\nچیز دیگهای میخوای؟',
  'این هم یه پیشنمایش از توانایی رسانهای من:\n\n| قابلیت | وضعیت |\n|--------|-------|\n| متن و مارکداون | ✅ فعال |\n| کد با هایلایت | ✅ فعال |\n| صوت (TTS) | 🔜 بهزودی |\n| تصویر | 🔜 بهزودی |\n\n> نکته: همه اینها روی دستگاه خودت اجرا میشه.'
]

function pickDemoResponse(input: string): string {
  // سوال دربارهٔ سازنده — در همهٔ حالتها اولویت دارد
  if (/سازنده|خالق|ساخت کیه|کی ساخته|who (made|created|built)/i.test(input)) {
    return `${CREATOR_INTRO}\n\nگیت‌هابش: [${CREATOR.name}](${CREATOR.github}) 🧡`
  }
  if (/سلام|درود|hello|hi/i.test(input)) return DEMO_RESPONSES[0]
  if (/چیه|چیست|توضیح|explain|what/i.test(input)) return DEMO_RESPONSES[1]
  return DEMO_RESPONSES[2]
}

/** تبدیل پیامهای assistant-ui به فرمت AI SDK */
function toAiSdkMessages(messages: ChatModelRunOptions['messages']) {
  return messages
    .filter(m => m.role === 'system' || m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map(p => p.text)
        .join('\n')
    }))
}

/** ساخت مدل بر اساس تنظیمات فعلی — null یعنی حالت نمایش */
function resolveModel(): { model: LanguageModel | null; error?: string } {
  const s = getModelSettings()

  if (s.provider === 'ollama') {
    const openai = createOpenAI({
      baseURL: s.ollamaBaseURL,
      apiKey: 'ollama' // Ollama کلید نمیخواهد ولی SDK اجباری است
    })
    return { model: openai.languageModel(s.ollamaModel) }
  }

  if (s.provider === 'openai') {
    if (!s.apiKey.trim()) {
      return { model: null, error: 'کلید API تنظیم نشده — در تنظیمات واردش کن' }
    }
    const openai = createOpenAI({ baseURL: s.apiBaseURL, apiKey: s.apiKey })
    return { model: openai.languageModel(s.apiModel) }
  }

  return { model: null }
}

const AtlasChatAdapter: ChatModelAdapter = {
  async *run(options) {
    const settings = getModelSettings()
    const lastUser = [...options.messages].reverse().find(m => m.role === 'user')

    /* ─── حالت نمایش ─── */
    if (settings.provider === 'demo') {
      const response = pickDemoResponse(
        lastUser
          ? lastUser.content.filter(p => p.type === 'text').map(p => ('text' in p ? String(p.text) : '')).join(' ')
          : ''
      )
      for (let i = 0; i < response.length; i += 3) {
        yield {
          content: [{ type: 'text' as const, text: response.slice(0, i + 3) }],
          status: { type: 'running' as const }
        }
        await new Promise(r => setTimeout(r, SIMULATION_DELAY))
      }
      yield {
        content: [{ type: 'text' as const, text: response }],
        status: { type: 'complete' as const, reason: 'stop' as const }
      }
      return
    }

    /* ─── مدل واقعی ─── */
    const { model, error } = resolveModel()
    if (!model) {
      const msg = `⚠️ ${error ?? 'مدلی در دسترس نیست'}`
      yield {
        content: [{ type: 'text' as const, text: msg }],
        status: { type: 'complete' as const, reason: 'stop' as const }
      }
      return
    }

    try {
      const result = streamText({
        model,
        system: buildSystemPrompt(settings.systemPrompt),
        messages: toAiSdkMessages(options.messages),
        temperature: settings.temperature,
        maxOutputTokens: settings.maxTokens,
        abortSignal: options.abortSignal
      })

      let emitted = false
      for await (const delta of result.textStream) {
        emitted = true
        yield {
          content: [{ type: 'text' as const, text: delta }],
          status: { type: 'running' as const }
        }
      }

      if (!emitted) {
        yield {
          content: [{ type: 'text' as const, text: 'پاسخی دریافت نشد — اتصال پروایدر را بررسی کن.' }],
          status: { type: 'complete' as const, reason: 'stop' as const }
        }
      }

      // اطمینان از خطاها بعد از پایان جریان
      await result.finishReason
    } catch (err) {
      // لغو توسط کاربر خطا نیست
      if (options.abortSignal.aborted) throw err

      let msg = 'خطای ناشناخته'
      if (err instanceof Error) msg = err.message
      else if (typeof err === 'object' && err !== null) msg = JSON.stringify(err)

      yield {
        content: [{ type: 'text' as const, text: `⚠️ خطا در ارتباط با مدل:\n\n\`${msg}\`\n\nآدرس پایه و نام مدل را در تنظیمات بررسی کن.` }],
        status: { type: 'complete' as const, reason: 'stop' as const }
      }
    }
  }
}

type ChatModelRunOptions = Parameters<ChatModelAdapter['run']>[0]

export function useAtlasRuntime(): AssistantRuntime {
  return useLocalRuntime(AtlasChatAdapter)
}
