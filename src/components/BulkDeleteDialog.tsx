'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@radix-ui/react-dialog'
import { useSelectionStore } from '@/lib/stores'
import { BulkOperationRequest, BulkOperationResponse } from '@/lib/types'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface BulkDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

export function BulkDeleteDialog({ open, onOpenChange, onComplete }: BulkDeleteDialogProps) {
  const { getSelectedIds, clearSelection, setLoading, setLastOperation } = useSelectionStore()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const selectedIds = getSelectedIds()

  const handleDelete = async () => {
    if (!confirmed) {
      toast.error('请确认删除操作')
      return
    }

    setIsDeleting(true)
    setLoading(true)

    try {
      const request: BulkOperationRequest = {
        postIds: selectedIds,
        action: 'delete'
      }

      const response = await fetch('/api/posts/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      const result: BulkOperationResponse = await response.json()

      if (result.success) {
        toast.success(`成功删除 ${result.data?.affectedCount} 篇笔记`)
        setLastOperation(result.data?.operationId || null)
        clearSelection()
        onComplete()
        onOpenChange(false)
      } else {
        toast.error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败，请稍后重试')
    } finally {
      setIsDeleting(false)
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmed(false)
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
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>确认批量删除</span>
            </h2>
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                您即将删除 <strong>{selectedIds.length}</strong> 篇笔记。
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                删除的笔记可以在7天内撤销，超过7天后将永久删除。
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  disabled={isDeleting}
                  className="rounded border-zinc-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  我确认要删除这些笔记
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4">
              <button
                onClick={handleClose}
                disabled={isDeleting}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || !confirmed}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeleting ? '删除中...' : '确认删除'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}