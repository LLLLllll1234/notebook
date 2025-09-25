'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@radix-ui/react-dialog'
import { useSelectionStore } from '@/lib/stores'
import { BulkOperationRequest, BulkOperationResponse } from '@/lib/types/types'
import { Tag, X, Plus, Minus, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface BulkTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

export function BulkTagDialog({ open, onOpenChange, onComplete }: BulkTagDialogProps) {
  const { getSelectedIds, clearSelection, setLoading, setLastOperation } = useSelectionStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [action, setAction] = useState<'add' | 'remove' | 'replace'>('add')
  const [tagNames, setTagNames] = useState('')
  const [oldTagName, setOldTagName] = useState('')
  const [newTagName, setNewTagName] = useState('')

  const selectedIds = getSelectedIds()

  const handleSubmit = async () => {
    if (action === 'replace' && (!oldTagName.trim() || !newTagName.trim())) {
      toast.error('请输入要替换的标签名')
      return
    }

    if (action !== 'replace' && !tagNames.trim()) {
      toast.error('请输入标签名')
      return
    }

    setIsProcessing(true)
    setLoading(true)

    try {
      const request: BulkOperationRequest = {
        postIds: selectedIds,
        action: 'tag',
        data: {
          action,
          ...(action === 'replace' ? 
            { oldTagName: oldTagName.trim(), newTagName: newTagName.trim() } :
            { tagNames: tagNames.split(',').map(t => t.trim()).filter(t => t) }
          )
        }
      }

      const response = await fetch('/api/posts/bulk-tag', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      const result: BulkOperationResponse = await response.json()

      if (result.success) {
        const actionText = action === 'add' ? '添加' : action === 'remove' ? '移除' : '替换'
        toast.success(`成功${actionText}标签，影响 ${result.data?.affectedCount} 个关联`)
        setLastOperation(result.data?.operationId || null)
        clearSelection()
        onComplete()
        onOpenChange(false)
        
        // 重置表单
        setTagNames('')
        setOldTagName('')
        setNewTagName('')
      } else {
        toast.error(result.error || '操作失败')
      }
    } catch (error) {
      console.error('标签操作失败:', error)
      toast.error('操作失败，请稍后重试')
    } finally {
      setIsProcessing(false)
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      setTagNames('')
      setOldTagName('')
      setNewTagName('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
              <Tag className="h-5 w-5 text-green-500" />
              <span>批量标签操作</span>
            </h2>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                将对 <strong>{selectedIds.length}</strong> 篇笔记执行标签操作
              </p>
            </div>

            {/* 操作类型选择 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                操作类型
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setAction('add')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                    action === 'add'
                      ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200'
                      : 'border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">添加</span>
                </button>
                <button
                  onClick={() => setAction('remove')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                    action === 'remove'
                      ? 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200'
                      : 'border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Minus className="h-4 w-4" />
                  <span className="text-sm">移除</span>
                </button>
                <button
                  onClick={() => setAction('replace')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                    action === 'replace'
                      ? 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-200'
                      : 'border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-sm">替换</span>
                </button>
              </div>
            </div>

            {/* 标签输入 */}
            {action === 'replace' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    原标签名
                  </label>
                  <input
                    type="text"
                    value={oldTagName}
                    onChange={(e) => setOldTagName(e.target.value)}
                    placeholder="要替换的标签名"
                    disabled={isProcessing}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    新标签名
                  </label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="新的标签名"
                    disabled={isProcessing}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-zinc-800"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  标签名（多个标签用逗号分隔）
                </label>
                <input
                  type="text"
                  value={tagNames}
                  onChange={(e) => setTagNames(e.target.value)}
                  placeholder="标签1, 标签2, 标签3"
                  disabled={isProcessing}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-zinc-800"
                />
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-4">
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
              >
                <Tag className="h-4 w-4" />
                <span>{isProcessing ? '处理中...' : '确认操作'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}