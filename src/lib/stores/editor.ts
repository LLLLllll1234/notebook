'use client'

import { create } from 'zustand'
import { EditorMode, TOCItem, EditorPreferences } from '@/lib/types'

interface EditorState {
  // 编辑器状态
  mode: EditorMode
  isAutoSave: boolean
  isDirty: boolean
  
  // 工具栏状态
  activeTools: string[]
  showToolbar: boolean
  
  // 目录状态
  tocItems: TOCItem[]
  tocVisible: boolean
  tocPosition: 'left' | 'right'
  activeTocId: string | null
  
  // 快捷键状态
  shortcutsEnabled: boolean
  
  // 草稿保存状态
  lastSaved: Date | null
  autoSaveTimer: NodeJS.Timeout | null
  
  // Actions
  setMode: (mode: EditorMode) => void
  toggleAutoSave: () => void
  setDirty: (dirty: boolean) => void
  
  // 工具栏管理
  setActiveTools: (tools: string[]) => void
  toggleTool: (tool: string) => void
  toggleToolbar: () => void
  
  // 目录管理
  setTocItems: (items: TOCItem[]) => void
  setTocVisible: (visible: boolean) => void
  setTocPosition: (position: 'left' | 'right') => void
  setActiveTocId: (id: string | null) => void
  
  // 快捷键管理
  toggleShortcuts: () => void
  
  // 自动保存管理
  setLastSaved: (date: Date) => void
  setAutoSaveTimer: (timer: NodeJS.Timeout | null) => void
  
  // 偏好设置
  loadPreferences: (prefs: Partial<EditorPreferences>) => void
  getPreferences: () => EditorPreferences
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // 初始状态
  mode: 'edit',
  isAutoSave: true,
  isDirty: false,
  
  // 工具栏状态
  activeTools: [],
  showToolbar: true,
  
  // 目录状态
  tocItems: [],
  tocVisible: true,
  tocPosition: 'left',
  activeTocId: null,
  
  // 快捷键状态
  shortcutsEnabled: true,
  
  // 草稿保存状态
  lastSaved: null,
  autoSaveTimer: null,
  
  // 编辑器模式
  setMode: (mode: EditorMode) => set(() => ({ mode })),
  
  toggleAutoSave: () => set((state) => ({ isAutoSave: !state.isAutoSave })),
  
  setDirty: (dirty: boolean) => set(() => ({ isDirty: dirty })),
  
  // 工具栏管理
  setActiveTools: (tools: string[]) => set(() => ({ activeTools: tools })),
  
  toggleTool: (tool: string) => set((state) => {
    const newTools = state.activeTools.includes(tool)
      ? state.activeTools.filter(t => t !== tool)
      : [...state.activeTools, tool]
    return { activeTools: newTools }
  }),
  
  toggleToolbar: () => set((state) => ({ showToolbar: !state.showToolbar })),
  
  // 目录管理
  setTocItems: (items: TOCItem[]) => set(() => ({ tocItems: items })),
  
  setTocVisible: (visible: boolean) => set(() => ({ tocVisible: visible })),
  
  setTocPosition: (position: 'left' | 'right') => set(() => ({ tocPosition: position })),
  
  setActiveTocId: (id: string | null) => set(() => ({ activeTocId: id })),
  
  // 快捷键管理
  toggleShortcuts: () => set((state) => ({ shortcutsEnabled: !state.shortcutsEnabled })),
  
  // 自动保存管理
  setLastSaved: (date: Date) => set(() => ({ lastSaved: date })),
  
  setAutoSaveTimer: (timer: NodeJS.Timeout | null) => set((state) => {
    // 清理之前的定时器
    if (state.autoSaveTimer) {
      clearTimeout(state.autoSaveTimer)
    }
    return { autoSaveTimer: timer }
  }),
  
  // 偏好设置
  loadPreferences: (prefs: Partial<EditorPreferences>) => set((state) => ({
    mode: prefs.mode || state.mode,
    isAutoSave: prefs.autoSave !== undefined ? prefs.autoSave : state.isAutoSave,
    tocVisible: prefs.tocVisible !== undefined ? prefs.tocVisible : state.tocVisible,
    tocPosition: prefs.tocPosition || state.tocPosition,
    showToolbar: prefs.toolbarConfig?.visible !== undefined ? prefs.toolbarConfig.visible : state.showToolbar,
    shortcutsEnabled: prefs.shortcuts ? Object.keys(prefs.shortcuts).length > 0 : state.shortcutsEnabled
  })),
  
  getPreferences: (): EditorPreferences => {
    const state = get()
    return {
      mode: state.mode,
      autoSave: state.isAutoSave,
      toolbarConfig: {
        visible: state.showToolbar,
        position: 'top',
        tools: state.activeTools
      },
      shortcuts: {}, // 可以根据需要扩展
      tocVisible: state.tocVisible,
      tocPosition: state.tocPosition
    }
  }
}))