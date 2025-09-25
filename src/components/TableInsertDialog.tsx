'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@radix-ui/react-dialog'
import { Table, X, Plus, Minus } from 'lucide-react'
import { motion } from 'framer-motion'

interface TableInsertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (markdown: string) => void
}

export function TableInsertDialog({ open, onOpenChange, onInsert }: TableInsertDialogProps) {
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [hasHeaders, setHasHeaders] = useState(true)

  const generateTableMarkdown = () => {
    const headers = Array.from({ length: cols }, (_, i) => `标题${i + 1}`)
    const separator = Array.from({ length: cols }, () => '---')
    const emptyRow = Array.from({ length: cols }, () => '')

    let markdown = ''

    if (hasHeaders) {
      // 表头
      markdown += `| ${headers.join(' | ')} |\n`
      markdown += `| ${separator.join(' | ')} |\n`
      
      // 数据行（减去表头行）
      for (let i = 0; i < rows - 1; i++) {
        markdown += `| ${emptyRow.join(' | ')} |\n`
      }
    } else {
      // 无表头，所有行都是数据行
      for (let i = 0; i < rows; i++) {
        markdown += `| ${emptyRow.join(' | ')} |\n`
      }
    }

    return markdown
  }

  const handleInsert = () => {
    const markdown = generateTableMarkdown()
    onInsert(markdown)
    onOpenChange(false)
  }

  const TablePreview = () => {
    const headers = Array.from({ length: cols }, (_, i) => `标题${i + 1}`)
    const emptyCell = '内容'

    return (
      <div className="border border-zinc-300 dark:border-zinc-600 rounded overflow-hidden">
        <table className="w-full text-sm">
          {hasHeaders && (
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                {headers.map((header, i) => (
                  <th key={i} className="px-3 py-2 border-r border-zinc-300 dark:border-zinc-600 last:border-r-0">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: hasHeaders ? rows - 1 : rows }, (_, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-800'}>
                {Array.from({ length: cols }, (_, j) => (
                  <td key={j} className="px-3 py-2 border-r border-b border-zinc-300 dark:border-zinc-600 last:border-r-0">
                    {emptyCell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-lg w-full p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
              <Table className="h-5 w-5 text-blue-500" />
              <span>插入表格</span>
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-6">
            {/* 表格尺寸设置 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  行数
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setRows(Math.max(1, rows - 1))}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{rows}</span>
                  <button
                    onClick={() => setRows(Math.min(20, rows + 1))}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  列数
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCols(Math.max(1, cols - 1))}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{cols}</span>
                  <button
                    onClick={() => setCols(Math.min(10, cols + 1))}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 表格选项 */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={hasHeaders}
                  onChange={(e) => setHasHeaders(e.target.checked)}
                  className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  包含表头
                </span>
              </label>
            </div>

            {/* 表格预览 */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                预览
              </label>
              <div className="max-h-40 overflow-auto">
                <TablePreview />
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-end space-x-2 pt-4">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleInsert}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Table className="h-4 w-4" />
                <span>插入表格</span>
              </button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}