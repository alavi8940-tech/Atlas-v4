import { create } from 'zustand'

export type PanelKind = 'chat' | 'browser' | 'terminal'

interface UiState {
  panel: PanelKind
  browserUrl: string | null
  setPanel: (p: PanelKind) => void
  openBrowser: (url?: string) => void
  openTerminal: () => void
}

export const useUiStore = create<UiState>((set) => ({
  panel: 'chat',
  browserUrl: null,
  setPanel: (p) => set({ panel: p }),
  openBrowser: (url) => set({ panel: 'browser', browserUrl: url ?? null }),
  openTerminal: () => set({ panel: 'terminal' }),
}))
