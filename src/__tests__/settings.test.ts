import { describe, it, expect } from 'vitest'
import { engineLabel, activeModelName, type ProviderKind } from '@/stores/settingsStore'
import { CORE_PROMPT } from '@/lib/corePrompt'

describe('settingsStore — برچسب و نام مدل', () => {
  it('engineLabel بر اساس پروتکل برچسب فارسی می‌سازد', () => {
    expect(engineLabel('ollama' as ProviderKind, 'llama3')).toContain('Ollama')
    expect(engineLabel('anthropic' as ProviderKind, 'claude')).toContain('Anthropic')
    expect(engineLabel('openai' as ProviderKind, 'gpt')).toContain('API')
  })

  it('activeModelName مدل فعال پروتکل را برمی‌گرداند', () => {
    expect(activeModelName({ provider: 'ollama', ollamaModel: 'llama3', apiModel: 'x', anthropicModel: 'y' })).toBe('llama3')
    expect(activeModelName({ provider: 'openai', ollamaModel: 'a', apiModel: 'gpt', anthropicModel: 'b' })).toBe('gpt')
  })
})

describe('CORE_PROMPT', () => {
  it('ابزارهای عامل را به مدل معرفی می‌کند', () => {
    expect(CORE_PROMPT).toContain('عامل')
    expect(CORE_PROMPT).toContain('shell_exec')
    expect(CORE_PROMPT.length).toBeGreaterThan(50)
  })
})
