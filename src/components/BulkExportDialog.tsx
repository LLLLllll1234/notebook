'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@radix-ui/react-dialog'
import { useSelectionStore } from '@/lib/stores'
import { BulkOperationRequest, BulkOperationResponse } from '@/lib/types'
import { Download, X, FileText, Archive, Database } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface BulkExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkExportDialog({ open, onOpenChange }: BulkExportDialogProps) {
  const { getSelectedIds, setLoading } = useSelectionStore()
  const [isExporting, setIsExporting] = useState(false)
  const [format, setFormat] = useState<'md' | 'json' | 'zip'>('md')
  const [includeAttachments, setIncludeAttachments] = useState(true)
  const [includeMetadata, setIncludeMetadata] = useState(true)

  const selectedIds = getSelectedIds()

  const handleExport = async () => {
    setIsExporting(true)
    setLoading(true)

    try {
      const request: BulkOperationRequest = {
        postIds: selectedIds,
        action: 'export',
        data: {
          format,
          includeAttachments,
          includeMetadata
        }
      }

      const response = await fetch('/api/posts/bulk-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      const result: BulkOperationResponse = await response.json()

      if (result.success) {
        const { downloadUrl, fileName } = result.data?.details || {}
        
        if (downloadUrl) {
          // 创建下载链接
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          toast.success(`成功导出 ${result.data?.affectedCount} 篇笔记`)
        } else {
          toast.error('导出文件生成失败')
        }
        
        onOpenChange(false)
      } else {
        toast.error(result.error || '导出失败')
      }
    } catch (error) {
      console.error('导出失败:', error)
      toast.error('导出失败，请稍后重试')
    } finally {
      setIsExporting(false)
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!isExporting) {
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
              <Download className="h-5 w-5 text-purple-500" />
              <span>批量导出笔记</span>
            </h2>
            <button
              onClick={handleClose}
              disabled={isExporting}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                将导出 <strong>{selectedIds.length}</strong> 篇笔记
              </p>
            </div>

            {/* 导出格式选择 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                导出格式
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="md"
                    checked={format === 'md'}
                    onChange={(e) => setFormat(e.target.value as 'md')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-sm font-medium">Markdown 文件</div>
                    <div className="text-xs text-zinc-500">单个文件或多个 .md 文件</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="zip"
                    checked={format === 'zip'}
                    onChange={(e) => setFormat(e.target.value as 'zip')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <Archive className="h-5 w-5 text-orange-500" />
                  <div>
                    <div className="text-sm font-medium">ZIP 压缩包</div>
                    <div className="text-xs text-zinc-500">包含所有 Markdown 文件的压缩包</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    checked={format === 'json'}
                    onChange={(e) => setFormat(e.target.value as 'json')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <Database className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-sm font-medium">JSON 数据</div>
                    <div className="text-xs text-zinc-500">结构化数据，便于导入其他系统</div>
                  </div>
                </label>
              </div>
            </div>

            {/* 导出选项 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                导出选项
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  disabled={isExporting}
                  className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  包含元数据（标题、标签、创建时间等）
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeAttachments}
                  onChange={(e) => setIncludeAttachments(e.target.checked)}
                  disabled={isExporting}
                  className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  包含附件信息
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4">
              <button
                onClick={handleClose}
                disabled={isExporting}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>{isExporting ? '导出中...' : '开始导出'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}