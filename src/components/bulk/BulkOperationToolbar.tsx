'use client'

import { useState } from 'react'
import { Trash2, Tag, Download, Undo2, X, CheckSquare, Square } from 'lucide-react'
import { useSelectionStore } from '@/lib/stores'
import { BulkDeleteDialog } from './BulkDeleteDialog'
import { BulkTagDialog } from './BulkTagDialog'
import { BulkExportDialog } from './BulkExportDialog'
import { PostWithTags } from '@/lib/types/types'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

interface BulkOperationToolbarProps {
  posts: PostWithTags[]
  onPostsChange: () => void
}

export function BulkOperationToolbar({ posts, onPostsChange }: BulkOperationToolbarProps) {
  const {
    selectedPosts,
    bulkOperationMode,
    isLoading,
    lastOperation,
    enterBulkMode,
    exitBulkMode,
    selectAll,
    clearSelection,
    getSelectedCount
  } = useSelectionStore()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showTagDialog, setShowTagDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  const selectedCount = getSelectedCount()
  const allSelected = selectedCount === posts.length && posts.length > 0

  const handleSelectAll = () => {
    if (allSelected) {
      clearSelection()
    } else {
      selectAll(posts.map(p => p.id))
    }
  }

  const handleEnterBulkMode = () => {
    enterBulkMode()
    toast.success('已进入批量操作模式')
  }

  const handleExitBulkMode = () => {
    exitBulkMode()
    toast.success('已退出批量操作模式')
  }

  return (
    <div>
      <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg">
        {!bulkOperationMode ? (
          <div className="flex items-center space-x-4">
            <button
              onClick={handleEnterBulkMode}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <CheckSquare className="h-4 w-4" />
              <span>批量操作</span>
            </button>
            
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              共 {posts.length} 篇笔记
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="inline-flex items-center space-x-2 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {allSelected ? '取消全选' : '全选'}
                  </span>
                </button>
                
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  已选择 {selectedCount} / {posts.length} 篇笔记
                </span>
              </div>

              <AnimatePresence>
                {selectedCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center space-x-2"
                  >
                    <button
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isLoading}
                      className="inline-flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>删除</span>
                    </button>

                    <button
                      onClick={() => setShowTagDialog(true)}
                      disabled={isLoading}
                      className="inline-flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                    >
                      <Tag className="h-4 w-4" />
                      <span>标签</span>
                    </button>

                    <button
                      onClick={() => setShowExportDialog(true)}
                      disabled={isLoading}
                      className="inline-flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>导出</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center space-x-2">
              {lastOperation && (
                <button
                  onClick={() => {
                    toast.success('撤销功能开发中')
                  }}
                  className="inline-flex items-center space-x-2 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Undo2 className="h-4 w-4" />
                  <span className="text-sm">撤销</span>
                </button>
              )}

              <button
                onClick={handleExitBulkMode}
                className="inline-flex items-center space-x-2 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
                <span className="text-sm">退出</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <BulkDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onComplete={onPostsChange}
      />

      <BulkTagDialog
        open={showTagDialog}
        onOpenChange={setShowTagDialog}
        onComplete={onPostsChange}
      />

      <BulkExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />
    </div>
  )
}