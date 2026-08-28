/**
 * Atlas Runtime — پل بین assistant-ui و موتور عامل
 * فاز ۲: استریم واقعی با AI SDK (آرسنال) — Ollama محلی / سازگار با OpenAI / Anthropic
 * حالت نمایش حذف شد؛ همیشه یک مدل واقعی لازم است.
 */
import {
  type AssistantRuntime,
  type ChatModelAdapter,
  useLocalRuntime,
} from '@assistant-ui/react'
import { streamText, type LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { getModelSettings, useSettingsStore } from '@/stores/settingsStore'
import { buildSystemPrompt } from '@/lib/corePrompt'
import { buildAgentTools } from '@/lib/agentTools'

/** ساخت مدل بر اساس تنظیمات فعلی — نبودِ model یعنی پیام خطا برای کاربر */
function resolveModel(): { model?: LanguageModel; error?: string } {
  const s = getModelSettings()

  if (s.provider === 'ollama') {
    if (!s.ollamaModel.trim()) {
      return { error: 'مدلی انتخاب نشده — از تنظیمات ⚙️ لیست مدلهای Ollama را بگیر' }
    }
    return {
      model: createOpenAI({
        baseURL: s.ollamaBaseURL,
        apiKey: 'ollama' // Ollama کلید نمیخواهد ولی SDK اجباری است
      }).languageModel(s.ollamaModel)
    }
  }

  if (s.provider === 'anthropic') {
    if (!s.anthropicApiKey.trim() || !s.anthropicModel.trim()) {
      return { error: 'کلید API یا مدل آنتراپیک تنظیم نشده — از تنظیمات ⚙️ تکمیلش کن' }
    }
    return {
      model: createAnthropic({ apiKey: s.anthropicApiKey }).languageModel(s.anthropicModel)
    }
  }

  // openai-compatible
  if (!s.apiKey.trim() || !s.apiModel.trim()) {
    return { error: 'کلید API یا مدل تنظیم نشده — از تنظیمات ⚙️ تکمیلش کن' }
  }
  return {
    model: createOpenAI({ baseURL: s.apiBaseURL, apiKey: s.apiKey }).languageModel(s.apiModel)
  }
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

const AtlasChatAdapter: ChatModelAdapter = {
  async *run(options) {
    const settings = getModelSettings()

    /* ─── مدل واقعی ─── */
    const { model, error } = resolveModel()
    if (!model) {
      yield {
        content: [{ type: 'text' as const, text: `⚠️ ${error ?? 'مدلی در دسترس نیست'}` }],
        status: { type: 'complete' as const, reason: 'stop' as const }
      }
      return
    }

    try {
      const agentEnabled = useSettingsStore.getState().agentEnabled
      const hasDesktop = typeof window !== 'undefined' && !!(window as unknown as { atlasAPI?: unknown }).atlasAPI
      const tools = agentEnabled && hasDesktop ? buildAgentTools() : undefined

      const result = streamText({
        model,
        system: buildSystemPrompt(settings.systemPrompt),
        messages: toAiSdkMessages(options.messages),
        abortSignal: options.abortSignal,
        ...(tools ? { tools, maxSteps: 12 } : {})
      })

      let emitted = false
      for await (const delta of result.textStream) {
        emitted = true
        yield {
          content: [{ type: 'text' as const, text: delta }],
          status: { type: 'running' as const }
        }
      }

      // اطمینان از خطاها بعد از پایان جریان
      await result.finishReason

      if (!emitted) {
        yield {
          content: [{ type: 'text' as const, text: 'پاسخی دریافت نشد — اتصال پروایدر را بررسی کن.' }],
          status: { type: 'complete' as const, reason: 'stop' as const }
        }
      }
    } catch (err) {
      // لغو توسط کاربر خطا نیست
      if (options.abortSignal.aborted) throw err

      let msg = 'خطای ناشناخته'
      if (err instanceof Error) msg = err.message
      else if (typeof err === 'object' && err !== null) msg = JSON.stringify(err)

      yield {
        content: [{ type: 'text' as const, text: `⚠️ خطا در ارتباط با مدل:\n\n\`${msg}\`\n\nاتصال، کلید API و مدل را در تنظیمات بررسی کن.` }],
        status: { type: 'complete' as const, reason: 'stop' as const }
      }
    }
  }
}

type ChatModelRunOptions = Parameters<ChatModelAdapter['run']>[0]

export function useAtlasRuntime(): AssistantRuntime {
  return useLocalRuntime(AtlasChatAdapter)
}
