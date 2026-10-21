import { create } from 'zustand'
import type { RpcStatus, ViewId } from '../../../shared/types'
import { uid } from '../lib/seed'

export type ToastKind = 'info' | 'success' | 'error' | 'warn'

export interface Toast {
  id: string
  kind: ToastKind
  title: string
  message?: string
}

interface UiStore {
  view: ViewId
  selectedPresenceBlockId: string | null
  selectedWidgetBlockId: string | null
  previewTab: 'activity' | 'profile'
  widgetPreviewLayout: 'hero' | 'contained' | null
  commandOpen: boolean
  publishOpen: boolean
  personaEditorId: string | null
  quickConnectOpen: boolean
  rpcStatus: RpcStatus
  goLiveBusy: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  toasts: Toast[]
  setView: (view: ViewId) => void
  setSelectedPresenceBlock: (id: string | null) => void
  setSelectedWidgetBlock: (id: string | null) => void
  setPreviewTab: (tab: 'activity' | 'profile') => void
  setCommandOpen: (open: boolean) => void
  setPublishOpen: (open: boolean) => void
  setPersonaEditor: (id: string | null) => void
  setQuickConnectOpen: (open: boolean) => void
  setRpcStatus: (status: RpcStatus) => void
  setGoLiveBusy: (busy: boolean) => void
  setSaveStatus: (status: UiStore['saveStatus']) => void
  toast: (kind: ToastKind, title: string, message?: string) => void
  dismissToast: (id: string) => void
}

export const useUiStore = create<UiStore>((set) => ({
  view: 'studio',
  selectedPresenceBlockId: null,
  selectedWidgetBlockId: null,
  previewTab: 'activity',
  widgetPreviewLayout: null,
  commandOpen: false,
  publishOpen: false,
  personaEditorId: null,
  quickConnectOpen: false,
  rpcStatus: { state: 'disconnected' },
  goLiveBusy: false,
  saveStatus: 'idle',
  toasts: [],

  setView: (view) => set({ view }),
  setSelectedPresenceBlock: (selectedPresenceBlockId) => set({ selectedPresenceBlockId }),
  setSelectedWidgetBlock: (selectedWidgetBlockId) => set({ selectedWidgetBlockId }),
  setPreviewTab: (previewTab) => set({ previewTab }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setPublishOpen: (publishOpen) => set({ publishOpen }),
  setPersonaEditor: (personaEditorId) => set({ personaEditorId }),
  setQuickConnectOpen: (quickConnectOpen) => set({ quickConnectOpen }),
  setRpcStatus: (rpcStatus) => set({ rpcStatus }),
  setGoLiveBusy: (goLiveBusy) => set({ goLiveBusy }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),

  toast: (kind, title, message) => {
    const id = uid()
    set((state) => ({ toasts: [...state.toasts, { id, kind, title, message }].slice(-4) }))
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
    }, kind === 'error' ? 6000 : 3800)
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
  }
}))

export function toast(kind: ToastKind, title: string, message?: string): void {
  useUiStore.getState().toast(kind, title, message)
}
