'use client'

import { create } from 'zustand'
import { BulkOperationType } from '@/lib/types'

interface SelectionState {
  // 选择状态
  selectedPosts: Set<string>
  bulkOperationMode: boolean
  
  // 操作状态
  isLoading: boolean
  lastOperation: string | null
  
  // Actions
  selectPost: (postId: string) => void
  deselectPost: (postId: string) => void
  selectAll: (postIds: string[]) => void
  clearSelection: () => void
  togglePost: (postId: string) => void
  
  // 批量操作模式
  enterBulkMode: () => void
  exitBulkMode: () => void
  
  // 操作状态管理
  setLoading: (loading: boolean) => void
  setLastOperation: (operation: string | null) => void
  
  // 辅助方法
  isSelected: (postId: string) => boolean
  getSelectedCount: () => number
  getSelectedIds: () => string[]
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  // 初始状态
  selectedPosts: new Set<string>(),
  bulkOperationMode: false,
  isLoading: false,
  lastOperation: null,
  
  // 选择操作
  selectPost: (postId: string) => set((state) => ({
    selectedPosts: new Set(state.selectedPosts.add(postId))
  })),
  
  deselectPost: (postId: string) => set((state) => {
    const newSet = new Set(state.selectedPosts)
    newSet.delete(postId)
    return { selectedPosts: newSet }
  }),
  
  selectAll: (postIds: string[]) => set(() => ({
    selectedPosts: new Set(postIds)
  })),
  
  clearSelection: () => set(() => ({
    selectedPosts: new Set<string>(),
    bulkOperationMode: false
  })),
  
  togglePost: (postId: string) => set((state) => {
    const newSet = new Set(state.selectedPosts)
    if (newSet.has(postId)) {
      newSet.delete(postId)
    } else {
      newSet.add(postId)
    }
    return { selectedPosts: newSet }
  }),
  
  // 批量操作模式
  enterBulkMode: () => set(() => ({
    bulkOperationMode: true
  })),
  
  exitBulkMode: () => set(() => ({
    bulkOperationMode: false,
    selectedPosts: new Set<string>()
  })),
  
  // 操作状态
  setLoading: (loading: boolean) => set(() => ({
    isLoading: loading
  })),
  
  setLastOperation: (operation: string | null) => set(() => ({
    lastOperation: operation
  })),
  
  // 辅助方法
  isSelected: (postId: string) => get().selectedPosts.has(postId),
  
  getSelectedCount: () => get().selectedPosts.size,
  
  getSelectedIds: () => Array.from(get().selectedPosts)
}))