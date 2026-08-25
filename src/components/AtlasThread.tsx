/**
 * AtlasThread — قالب شیشهای برای assistant-ui
 * API دقیق: ThreadPrimitive.Messages با components / MessagePrimitive.Root + Parts
 */
import {
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  ErrorPrimitive,
  ActionBarPrimitive,
  useAuiState,
} from '@assistant-ui/react'
import { ArrowDownIcon, CopyIcon, RefreshCwIcon, SendHorizontalIcon, SquareIcon, CheckIcon } from 'lucide-react'
import { MarkdownText } from '@/components/assistant-ui/markdown-text'
import { TooltipIconButton } from '@/components/assistant-ui/tooltip-icon-button'

function UserBubble(): React.JSX.Element {
  return (
    <MessagePrimitive.Root className="rise-in max-w-[85%] self-start">
      <div className="glass rounded-[1.3rem] rounded-tr-md px-4 py-3 text-sm leading-relaxed">
        <MessagePrimitive.Parts components={{ Text: MarkdownText }} />
      </div>
    </MessagePrimitive.Root>
  )
}

function AssistantBubble(): React.JSX.Element {
  return (
    <MessagePrimitive.Root className="rise-in group max-w-[85%] self-end">
      <div
        className="glass glass-accent-ring rounded-[1.3rem] rounded-tl-md px-4 py-3 text-sm leading-relaxed"
        style={{ background: 'var(--accent-soft)' }}
      >
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--accent)' }}>
          🧭 Atlas
        </div>
        <MessagePrimitive.Parts components={{ Text: MarkdownText }} />
      </div>

      {/* اکشنبار — کپی و تولید دوباره */}
      <ActionBarPrimitive.Root
        hideWhenRunning
        autohide="not-last"
        className="mt-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <ActionBarPrimitive.Copy asChild>
          <TooltipIconButton tooltip="کپی" className="glass rounded-lg p-1.5" style={{ color: 'var(--text-secondary)' }}>
            <MessagePrimitive.If copied>
              <CheckIcon size={13} />
            </MessagePrimitive.If>
            <MessagePrimitive.If copied={false}>
              <CopyIcon size={13} />
            </MessagePrimitive.If>
          </TooltipIconButton>
        </ActionBarPrimitive.Copy>
        <ActionBarPrimitive.Reload asChild>
          <TooltipIconButton tooltip="تولید دوباره" className="glass rounded-lg p-1.5" style={{ color: 'var(--text-secondary)' }}>
            <RefreshCwIcon size={13} />
          </TooltipIconButton>
        </ActionBarPrimitive.Reload>
      </ActionBarPrimitive.Root>
    </MessagePrimitive.Root>
  )
}

function RunningDots(): React.JSX.Element | null {
  const isRunning = useAuiState(s => s.thread.isRunning)
  if (!isRunning) return null
  return (
    <div className="flex items-center gap-2.5 self-end px-2 pb-1">
      {/* گوی کوچک در حالت فکر کردن */}
      <div className="atlas-orb" data-state="thinking" style={{ width: 26, height: 26 }}>
        <div className="orb-eyes" style={{ gap: '12%' }}>
          <div className="orb-eye" style={{ width: '22%', height: '26%' }} />
          <div className="orb-eye" style={{ width: '22%', height: '26%' }} />
        </div>
      </div>
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  )
}

export function AtlasThread(): React.JSX.Element {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col">
      <ThreadPrimitive.Viewport
        autoScroll
        className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-6 scroll-smooth"
      >
        <div className="group flex w-full max-w-3xl flex-1 flex-col gap-4">
          <ThreadPrimitive.Messages
            components={{
              UserMessage: UserBubble,
              AssistantMessage: AssistantBubble
            }}
          />
          <RunningDots />
        </div>
      </ThreadPrimitive.Viewport>

      <ThreadPrimitive.ViewportFooter className="px-4 pb-4">
        <div className="mx-auto w-full max-w-3xl">
          {/* دکمه رفتن به آخرین پیام */}
          <div className="mb-2 flex justify-center">
            <ThreadPrimitive.ScrollToBottom asChild>
              <button className="glass glass-hover rounded-full p-2.5" title="رفتن به آخرین پیام" style={{ color: 'var(--text-secondary)' }}>
                <ArrowDownIcon size={15} />
              </button>
            </ThreadPrimitive.ScrollToBottom>
          </div>

          <ThreadPrimitive.If running={false}>
            <ComposerPrimitive.Root className="glass glass-accent-ring rounded-[1.5rem] p-2 transition-colors">
              <ComposerPrimitive.Input
                rows={1}
                autoFocus
                placeholder="از Atlas بپرس... (Enter ارسال)"
                className="max-h-40 flex-grow resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:opacity-50"
                style={{ color: 'var(--text-primary)' }}
              />
              <div className="flex items-center px-1 pb-0.5">
                <span className="mr-2 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  🔒 محلی‌محور — دادهها روی دستگاه تو میمانند
                </span>
                <ComposerPrimitive.Send asChild>
                  <button
                    className="mr-auto flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform hover:scale-110"
                    style={{ background: 'var(--accent)' }}
                    title="ارسال"
                  >
                    <SendHorizontalIcon size={16} />
                  </button>
                </ComposerPrimitive.Send>
              </div>
            </ComposerPrimitive.Root>
          </ThreadPrimitive.If>

          <ThreadPrimitive.If running>
            <ComposerPrimitive.Cancel asChild>
              <button
                className="glass mx-auto flex h-10 items-center gap-2 rounded-full border px-5 text-sm transition-colors"
                style={{ color: 'var(--text-primary)', borderColor: 'var(--glass-border)' }}
              >
                <SquareIcon size={14} /> توقف
              </button>
            </ComposerPrimitive.Cancel>
          </ThreadPrimitive.If>
        </div>

        <ErrorPrimitive.Root className="glass mx-4 mt-3 rounded-xl border-red-400/40 px-4 py-2 text-sm text-red-400">
          <ErrorPrimitive.Message />
        </ErrorPrimitive.Root>
      </ThreadPrimitive.ViewportFooter>
    </ThreadPrimitive.Root>
  )
}
